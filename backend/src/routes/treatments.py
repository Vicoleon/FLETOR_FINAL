from flask import Blueprint, request, jsonify
from src.models.user import db, TreatmentType, Specialization, User, UserType
from src.routes.auth import token_required

treatments_bp = Blueprint('treatments', __name__)

# =====================================================
# TREATMENT TYPES ENDPOINTS
# =====================================================

@treatments_bp.route('/treatment-types', methods=['GET'])
def get_treatment_types():
    """Get all active treatment types"""
    try:
        treatments = TreatmentType.query.filter_by(is_active=True).order_by(
            TreatmentType.is_system_default.desc(),
            TreatmentType.name.asc()
        ).all()
        
        return jsonify({
            'treatments': [treatment.to_dict() for treatment in treatments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/treatment-types', methods=['POST'])
@token_required
def create_treatment_type(current_user):
    """Create a new treatment type"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can create treatment types'}), 403
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Treatment name is required'}), 400
        
        # Check if treatment already exists
        existing = TreatmentType.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Treatment type already exists'}), 400
        
        treatment = TreatmentType(
            name=data['name'],
            description=data.get('description', ''),
            is_system_default=False,  # User-created treatments are not system defaults
            created_by=current_user.id # Changed from created_by_user_id
        )
        
        db.session.add(treatment)
        db.session.commit()
        
        return jsonify({
            'message': 'Treatment type created successfully',
            'treatment': treatment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/treatment-types/<int:treatment_id>', methods=['PUT'])
@token_required
def update_treatment_type(current_user, treatment_id):
    """Update a treatment type (only creator or admin)"""
    try:
        treatment = TreatmentType.query.get(treatment_id)
        if not treatment:
            return jsonify({'error': 'Treatment type not found'}), 404
        
        # Only allow creator or admin to update
        if (current_user.user_type != UserType.ADMIN and 
            treatment.created_by != current_user.id): # Changed from treatment.created_by_user_id
            return jsonify({'error': 'Permission denied'}), 403
        
        # System defaults can only be updated by admins
        if treatment.is_system_default and current_user.user_type != UserType.ADMIN:
            return jsonify({'error': 'Only admins can update system defaults'}), 403
        
        data = request.get_json()
        
        if 'name' in data:
            # Check if name conflicts with existing treatment
            existing = TreatmentType.query.filter(
                TreatmentType.name == data['name'],
                TreatmentType.id != treatment_id
            ).first()
            if existing:
                return jsonify({'error': 'Treatment type name already exists'}), 400
            treatment.name = data['name']
        
        if 'description' in data:
            treatment.description = data['description']
        
        if 'is_active' in data:
            treatment.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Treatment type updated successfully',
            'treatment': treatment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/treatment-types/<int:treatment_id>', methods=['DELETE'])
@token_required
def delete_treatment_type(current_user, treatment_id):
    """Delete a treatment type (soft delete)"""
    try:
        treatment = TreatmentType.query.get(treatment_id)
        if not treatment:
            return jsonify({'error': 'Treatment type not found'}), 404
        
        # Only allow creator or admin to delete
        if (current_user.user_type != UserType.ADMIN and 
            treatment.created_by != current_user.id): # Changed from treatment.created_by_user_id
            return jsonify({'error': 'Permission denied'}), 403
        
        # System defaults cannot be deleted
        if treatment.is_system_default:
            return jsonify({'error': 'System defaults cannot be deleted'}), 403
        
        # Soft delete
        treatment.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Treatment type deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =====================================================
# SPECIALIZATIONS ENDPOINTS
# =====================================================

@treatments_bp.route('/specializations', methods=['GET'])
def get_specializations():
    """Get all active specializations"""
    try:
        specializations = Specialization.query.filter_by(is_active=True).order_by(
            Specialization.is_system_default.desc(),
            Specialization.name.asc()
        ).all()
        
        return jsonify({
            'specializations': [spec.to_dict() for spec in specializations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/specializations', methods=['POST'])
@token_required
def create_specialization(current_user):
    """Create a new specialization"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can create specializations'}), 403
        
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Specialization name is required'}), 400
        
        # Check if specialization already exists
        existing = Specialization.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Specialization already exists'}), 400
        
        specialization = Specialization(
            name=data['name'],
            description=data.get('description', ''),
            is_system_default=False,  # User-created specializations are not system defaults
            created_by_user_id=current_user.id
        )
        
        db.session.add(specialization)
        db.session.commit()
        
        return jsonify({
            'message': 'Specialization created successfully',
            'specialization': specialization.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/specializations/<int:spec_id>', methods=['PUT'])
@token_required
def update_specialization(current_user, spec_id):
    """Update a specialization (only creator or admin)"""
    try:
        specialization = Specialization.query.get(spec_id)
        if not specialization:
            return jsonify({'error': 'Specialization not found'}), 404
        
        # Only allow creator or admin to update
        if (current_user.user_type != UserType.ADMIN and 
            specialization.created_by_user_id != current_user.id):
            return jsonify({'error': 'Permission denied'}), 403
        
        # System defaults can only be updated by admins
        if specialization.is_system_default and current_user.user_type != UserType.ADMIN:
            return jsonify({'error': 'Only admins can update system defaults'}), 403
        
        data = request.get_json()
        
        if 'name' in data:
            # Check if name conflicts with existing specialization
            existing = Specialization.query.filter(
                Specialization.name == data['name'],
                Specialization.id != spec_id
            ).first()
            if existing:
                return jsonify({'error': 'Specialization name already exists'}), 400
            specialization.name = data['name']
        
        if 'description' in data:
            specialization.description = data['description']
        
        if 'is_active' in data:
            specialization.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Specialization updated successfully',
            'specialization': specialization.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@treatments_bp.route('/specializations/<int:spec_id>', methods=['DELETE'])
@token_required
def delete_specialization(current_user, spec_id):
    """Delete a specialization (soft delete)"""
    try:
        specialization = Specialization.query.get(spec_id)
        if not specialization:
            return jsonify({'error': 'Specialization not found'}), 404
        
        # Only allow creator or admin to delete
        if (current_user.user_type != UserType.ADMIN and 
            specialization.created_by_user_id != current_user.id):
            return jsonify({'error': 'Permission denied'}), 403
        
        # System defaults cannot be deleted
        if specialization.is_system_default:
            return jsonify({'error': 'System defaults cannot be deleted'}), 403
        
        # Soft delete
        specialization.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Specialization deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# =====================================================
# DATA POPULATION ENDPOINTS
# =====================================================

@treatments_bp.route('/populate-defaults', methods=['POST'])
@token_required
def populate_default_data(current_user):
    """Populate default treatment types and specializations (admin only)"""
    try:
        if current_user.user_type != UserType.ADMIN:
            return jsonify({'error': 'Only admins can populate default data'}), 403
        
        # Default treatment types
        default_treatments = [
            {'name': 'Dental Implants', 'description': 'Surgical placement of artificial tooth roots'},
            {'name': 'Dental Veneers', 'description': 'Thin shells covering the front of teeth'},
            {'name': 'Dental Cleaning', 'description': 'Professional teeth cleaning and plaque removal'},
            {'name': 'Dental Bridges', 'description': 'Fixed prosthetic devices to replace missing teeth'},
            {'name': 'Cosmetic Dentistry', 'description': 'Procedures to improve dental aesthetics'},
            {'name': 'Dental Crowns', 'description': 'Caps that cover damaged or weak teeth'},
            {'name': 'Teeth Whitening', 'description': 'Bleaching treatments to brighten teeth'},
            {'name': 'Root Canal', 'description': 'Treatment of infected or damaged tooth pulp'},
            {'name': 'Orthodontics', 'description': 'Correction of teeth and jaw alignment'},
            {'name': 'Oral Surgery', 'description': 'Surgical procedures in the mouth and jaw area'},
        ]
        
        # Default specializations
        default_specializations = [
            {'name': 'Cosmetic Dentistry', 'description': 'Focus on improving dental aesthetics'},
            {'name': 'Orthodontics', 'description': 'Correction of teeth and jaw alignment'},
            {'name': 'Oral Surgery', 'description': 'Surgical procedures in oral and maxillofacial area'},
            {'name': 'Periodontics', 'description': 'Treatment of gum disease and supporting structures'},
            {'name': 'Endodontics', 'description': 'Root canal therapy and pulp treatment'},
            {'name': 'Prosthodontics', 'description': 'Replacement and restoration of teeth'},
            {'name': 'Implantology', 'description': 'Placement and maintenance of dental implants'},
            {'name': 'General Dentistry', 'description': 'Comprehensive oral health care'},
        ]
        
        treatments_created = 0
        specializations_created = 0
        
        # Create treatment types
        for treatment_data in default_treatments:
            existing = TreatmentType.query.filter_by(name=treatment_data['name']).first()
            if not existing:
                treatment = TreatmentType(
                    name=treatment_data['name'],
                    description=treatment_data['description'],
                    is_system_default=True,
                    created_by_user_id=current_user.id
                )
                db.session.add(treatment)
                treatments_created += 1
        
        # Create specializations
        for spec_data in default_specializations:
            existing = Specialization.query.filter_by(name=spec_data['name']).first()
            if not existing:
                specialization = Specialization(
                    name=spec_data['name'],
                    description=spec_data['description'],
                    is_system_default=True,
                    created_by_user_id=current_user.id
                )
                db.session.add(specialization)
                specializations_created += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Default data populated successfully',
            'treatments_created': treatments_created,
            'specializations_created': specializations_created
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500