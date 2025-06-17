from flask import Blueprint, request, jsonify
from src.models.user import db, DentalPackage, Dentist, User, UserType, TreatmentType, Procedure
from src.routes.auth import token_required

packages_bp = Blueprint('packages', __name__)

# PROCEDURE ENDPOINTS
@packages_bp.route('/procedures', methods=['GET'])
def get_procedures():
    """Get all active procedures"""
    try:
        procedures = Procedure.query.filter_by(is_active=True).order_by(Procedure.name.asc()).all()
        return jsonify({'procedures': [p.to_dict() for p in procedures]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/procedures', methods=['POST'])
@token_required
def create_procedure(current_user):
    """Create a new procedure (admin or dentist)"""
    try:
        if current_user.user_type not in [UserType.ADMIN, UserType.DENTIST]:
            return jsonify({'error': 'Only admins or dentists can create procedures'}), 403
        data = request.get_json()
        if not data.get('name'):
            return jsonify({'error': 'Procedure name is required'}), 400
        existing = Procedure.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Procedure already exists'}), 400
        procedure = Procedure(
            name=data['name'],
            description=data.get('description', ''),
            is_active=True
        )
        db.session.add(procedure)
        db.session.commit()
        return jsonify({'message': 'Procedure created successfully', 'procedure': procedure.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        import traceback
        print('Error in create_procedure:', traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@packages_bp.route('/', methods=['GET'])
def get_packages():
    """Get all active dental packages"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        specialization = request.args.get('specialization')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        query = DentalPackage.query.filter_by(is_active=True)
        
        # Apply filters
        if specialization:
            query = query.join(Dentist).filter(Dentist.specialization.ilike(f'%{specialization}%'))
        
        if min_price:
            query = query.filter(DentalPackage.price_usd >= min_price)
        
        if max_price:
            query = query.filter(DentalPackage.price_usd <= max_price)
        
        packages = query.paginate(page=page, per_page=per_page, error_out=False)
        
        result = []
        for package in packages.items:
            package_data = package.to_dict()
            # Add dentist information
            dentist = Dentist.query.get(package.dentist_id)
            if dentist:
                package_data['dentist'] = {
                    'name': f"{dentist.first_name} {dentist.last_name}",
                    'clinic_name': dentist.clinic_name,
                    'specialization': dentist.specialization,
                    'specializations': [spec.to_dict() for spec in dentist.specializations],
                    'rating': dentist.rating,
                    'years_experience': dentist.years_experience,
                    'is_verified': dentist.is_verified
                }
            result.append(package_data)
        
        return jsonify({
            'packages': result,
            'pagination': {
                'page': packages.page,
                'pages': packages.pages,
                'per_page': packages.per_page,
                'total': packages.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/<int:package_id>', methods=['GET'])
def get_package(package_id):
    """Get specific package details"""
    try:
        package = DentalPackage.query.get(package_id)
        if not package:
            return jsonify({'error': 'Package not found'}), 404
        
        package_data = package.to_dict()
        
        # Add dentist information
        dentist = Dentist.query.get(package.dentist_id)
        if dentist:
            package_data['dentist'] = dentist.to_dict()
        
        return jsonify(package_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/', methods=['POST'])
@token_required
def create_package(current_user):
    """Create a new dental package (dentists only)"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can create packages'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'price_usd']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        package = DentalPackage(
            dentist_id=dentist.id,
            name=data['name'],
            description=data['description'],
            procedures_included=data.get('procedures_included'),
            price_usd=data['price_usd'],
            duration_days=data.get('duration_days'),
            includes_accommodation=data.get('includes_accommodation', False),
            includes_transportation=data.get('includes_transportation', False),
            max_patients=data.get('max_patients', 1)
        )
        
        db.session.add(package)
        db.session.flush()  # Flush to get the package ID
        
        # Handle treatment associations
        if 'treatment_ids' in data and data['treatment_ids']:
            for treatment_id in data['treatment_ids']:
                treatment = TreatmentType.query.get(treatment_id)
                if treatment and treatment.is_active:
                    package.treatments.append(treatment)
        
        # Handle procedure associations
        if 'procedure_ids' in data and data['procedure_ids']:
            for procedure_id in data['procedure_ids']:
                procedure = Procedure.query.get(procedure_id)
                if procedure and procedure.is_active:
                    package.procedures.append(procedure)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Package created successfully',
            'package': package.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/<int:package_id>', methods=['PUT'])
@token_required
def update_package(current_user, package_id):
    """Update a dental package (package owner only)"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can update packages'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        package = DentalPackage.query.get(package_id)
        if not package:
            return jsonify({'error': 'Package not found'}), 404
        
        if package.dentist_id != dentist.id:
            return jsonify({'error': 'You can only update your own packages'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            package.name = data['name']
        if 'description' in data:
            package.description = data['description']
        if 'procedures_included' in data:
            package.procedures_included = data['procedures_included']
        if 'price_usd' in data:
            package.price_usd = data['price_usd']
        if 'duration_days' in data:
            package.duration_days = data['duration_days']
        if 'includes_accommodation' in data:
            package.includes_accommodation = data['includes_accommodation']
        if 'includes_transportation' in data:
            package.includes_transportation = data['includes_transportation']
        if 'max_patients' in data:
            package.max_patients = data['max_patients']
        if 'is_active' in data:
            package.is_active = data['is_active']
        
        # Handle treatment associations
        if 'treatment_ids' in data:
            # Clear existing treatments
            package.treatments.clear()
            
            # Add new treatments
            if data['treatment_ids']:
                for treatment_id in data['treatment_ids']:
                    treatment = TreatmentType.query.get(treatment_id)
                    if treatment and treatment.is_active:
                        package.treatments.append(treatment)
        
        # Handle procedure associations
        if 'procedure_ids' in data:
            package.procedures.clear()
            if data['procedure_ids']:
                for procedure_id in data['procedure_ids']:
                    procedure = Procedure.query.get(procedure_id)
                    if procedure and procedure.is_active:
                        package.procedures.append(procedure)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Package updated successfully',
            'package': package.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/<int:package_id>', methods=['DELETE'])
@token_required
def delete_package(current_user, package_id):
    """Delete a dental package (package owner only)"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can delete packages'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        package = DentalPackage.query.get(package_id)
        if not package:
            return jsonify({'error': 'Package not found'}), 404
        
        if package.dentist_id != dentist.id:
            return jsonify({'error': 'You can only delete your own packages'}), 403
        
        # Soft delete - mark as inactive instead of hard delete
        package.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Package deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@packages_bp.route('/my-packages', methods=['GET'])
@token_required
def get_my_packages(current_user):
    """Get packages for the current dentist"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can view their packages'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        packages = DentalPackage.query.filter_by(dentist_id=dentist.id, is_active=True).all()
        
        return jsonify({
            'packages': [package.to_dict() for package in packages]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

