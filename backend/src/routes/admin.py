from flask import Blueprint, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from src.models.user import User, Patient, Dentist, DentalPackage, Booking, Review, Notification, UserType, BookingStatus, db
from src.routes.auth import token_required
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func, desc

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(current_user, *args, **kwargs):
        if not current_user or current_user.user_type != UserType.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated_function

# Dashboard Statistics
@admin_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats(current_user):
    try:
        # User statistics
        total_users = User.query.count()
        total_patients = User.query.filter_by(user_type=UserType.PATIENT).count()
        total_dentists = User.query.filter_by(user_type=UserType.DENTIST).count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # New users this month
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users_month = User.query.filter(User.created_at >= thirty_days_ago).count()
        
        # Booking statistics
        total_bookings = Booking.query.count()
        pending_bookings = Booking.query.filter_by(status=BookingStatus.PENDING).count()
        confirmed_bookings = Booking.query.filter_by(status=BookingStatus.CONFIRMED).count()
        completed_bookings = Booking.query.filter_by(status=BookingStatus.COMPLETED).count()
        
        # Revenue statistics
        total_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
        ).scalar() or 0
        
        monthly_revenue = db.session.query(func.sum(Booking.total_amount)).filter(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
            Booking.created_at >= thirty_days_ago
        ).scalar() or 0
        
        # Package statistics
        total_packages = DentalPackage.query.count()
        active_packages = DentalPackage.query.filter_by(is_active=True).count()
        
        # Review statistics
        total_reviews = Review.query.count()
        average_rating = db.session.query(func.avg(Review.rating)).scalar() or 0
        
        return jsonify({
            'users': {
                'total': total_users,
                'patients': total_patients,
                'dentists': total_dentists,
                'active': active_users,
                'new_this_month': new_users_month
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'confirmed': confirmed_bookings,
                'completed': completed_bookings
            },
            'revenue': {
                'total': float(total_revenue),
                'monthly': float(monthly_revenue)
            },
            'packages': {
                'total': total_packages,
                'active': active_packages
            },
            'reviews': {
                'total': total_reviews,
                'average_rating': float(average_rating)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Management
@admin_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_type = request.args.get('user_type', '')
        search = request.args.get('search', '')
        
        query = User.query
        
        if user_type:
            query = query.filter_by(user_type=UserType(user_type))
            
        if search:
            query = query.filter(
                (User.username.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            )
            
        users = query.order_by(desc(User.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Get profile data for each user
        user_data = []
        for user in users.items:
            user_dict = user.to_dict()
            
            # Add profile information
            if user.user_type == UserType.PATIENT:
                profile = Patient.query.filter_by(user_id=user.id).first()
                if profile:
                    user_dict['profile'] = profile.to_dict()
            elif user.user_type == UserType.DENTIST:
                profile = Dentist.query.filter_by(user_id=user.id).first()
                if profile:
                    user_dict['profile'] = profile.to_dict()
                    
            user_data.append(user_dict)
        
        return jsonify({
            'users': user_data,
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': users.has_next,
            'has_prev': users.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user_details(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        user_dict = user.to_dict()
        
        # Add profile information
        if user.user_type == UserType.PATIENT:
            profile = Patient.query.filter_by(user_id=user.id).first()
            if profile:
                user_dict['profile'] = profile.to_dict()
        elif user.user_type == UserType.DENTIST:
            profile = Dentist.query.filter_by(user_id=user.id).first()
            if profile:
                user_dict['profile'] = profile.to_dict()
        
        # Add statistics
        if user.user_type == UserType.PATIENT:
            user_dict['stats'] = {
                'total_bookings': Booking.query.filter_by(patient_id=profile.id if profile else None).count(),
                'completed_bookings': Booking.query.filter_by(
                    patient_id=profile.id if profile else None, 
                    status=BookingStatus.COMPLETED
                ).count()
            }
        elif user.user_type == UserType.DENTIST:
            user_dict['stats'] = {
                'total_packages': DentalPackage.query.filter_by(dentist_id=profile.id if profile else None).count(),
                'total_bookings': Booking.query.filter_by(dentist_id=profile.id if profile else None).count(),
                'completed_bookings': Booking.query.filter_by(
                    dentist_id=profile.id if profile else None, 
                    status=BookingStatus.COMPLETED
                ).count()
            }
        
        return jsonify({'user': user_dict}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
@token_required
@admin_required
def toggle_user_status(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = not user.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Booking Management
@admin_bp.route('/bookings', methods=['GET'])
@token_required
@admin_required
def get_all_bookings(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', '')
        
        query = Booking.query
        
        if status:
            query = query.filter_by(status=BookingStatus(status))
            
        bookings = query.order_by(desc(Booking.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Add related data
        booking_data = []
        for booking in bookings.items:
            booking_dict = booking.to_dict()
            
            # Add patient info
            patient = Patient.query.get(booking.patient_id)
            if patient:
                booking_dict['patient'] = {
                    'name': f"{patient.first_name} {patient.last_name}",
                    'email': patient.user.email
                }
            
            # Add dentist info
            dentist = Dentist.query.get(booking.dentist_id)
            if dentist:
                booking_dict['dentist'] = {
                    'name': f"Dr. {dentist.first_name} {dentist.last_name}",
                    'clinic': dentist.clinic_name
                }
            
            # Add package info
            package = DentalPackage.query.get(booking.package_id)
            if package:
                booking_dict['package'] = {
                    'name': package.name,
                    'price': package.price_usd
                }
                
            booking_data.append(booking_dict)
        
        return jsonify({
            'bookings': booking_data,
            'total': bookings.total,
            'pages': bookings.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': bookings.has_next,
            'has_prev': bookings.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Package Management
@admin_bp.route('/packages', methods=['GET'])
@token_required
@admin_required
def get_all_packages(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        packages = DentalPackage.query.order_by(desc(DentalPackage.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Add dentist info
        package_data = []
        for package in packages.items:
            package_dict = package.to_dict()
            
            # Add dentist info
            dentist = Dentist.query.get(package.dentist_id)
            if dentist:
                package_dict['dentist'] = {
                    'name': f"Dr. {dentist.first_name} {dentist.last_name}",
                    'clinic': dentist.clinic_name
                }
            
            # Add booking count
            package_dict['booking_count'] = Booking.query.filter_by(package_id=package.id).count()
            
            package_data.append(package_dict)
        
        return jsonify({
            'packages': package_data,
            'total': packages.total,
            'pages': packages.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': packages.has_next,
            'has_prev': packages.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/packages/<int:package_id>/toggle-status', methods=['POST'])
@token_required
@admin_required
def toggle_package_status(current_user, package_id):
    try:
        package = DentalPackage.query.get_or_404(package_id)
        package.is_active = not package.is_active
        db.session.commit()
        
        return jsonify({
            'message': f'Package {"activated" if package.is_active else "deactivated"} successfully',
            'is_active': package.is_active
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dentist Verification
@admin_bp.route('/dentists/<int:dentist_id>/verify', methods=['POST'])
@token_required
@admin_required
def verify_dentist(current_user, dentist_id):
    try:
        dentist = Dentist.query.get_or_404(dentist_id)
        dentist.is_verified = True
        db.session.commit()
        
        # Send notification to dentist
        from src.routes.auth import create_notification
        create_notification(
            dentist.user_id,
            'Account Verified',
            'Your dentist account has been verified by our admin team. You can now accept bookings.',
            'system'
        )
        
        return jsonify({'message': 'Dentist verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics
@admin_bp.route('/analytics/revenue', methods=['GET'])
@token_required
@admin_required
def get_revenue_analytics(current_user):
    try:
        # Monthly revenue for the last 12 months
        monthly_data = []
        for i in range(12):
            start_date = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
            end_date = start_date + timedelta(days=31)
            
            revenue = db.session.query(func.sum(Booking.total_amount)).filter(
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
                Booking.created_at >= start_date,
                Booking.created_at < end_date
            ).scalar() or 0
            
            monthly_data.append({
                'month': start_date.strftime('%Y-%m'),
                'revenue': float(revenue)
            })
        
        # Top dentists by revenue
        top_dentists = db.session.query(
            Dentist.first_name,
            Dentist.last_name,
            Dentist.clinic_name,
            func.sum(Booking.total_amount).label('total_revenue')
        ).join(Booking).filter(
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED])
        ).group_by(Dentist.id).order_by(desc('total_revenue')).limit(10).all()
        
        top_dentists_data = [
            {
                'name': f"Dr. {dentist.first_name} {dentist.last_name}",
                'clinic': dentist.clinic_name,
                'revenue': float(dentist.total_revenue)
            }
            for dentist in top_dentists
        ]
        
        return jsonify({
            'monthly_revenue': monthly_data,
            'top_dentists': top_dentists_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# System Management
@admin_bp.route('/system/cleanup', methods=['POST'])
@token_required
@admin_required
def system_cleanup(current_user):
    try:
        # Clean up old notifications (older than 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        old_notifications = Notification.query.filter(
            Notification.created_at < thirty_days_ago,
            Notification.is_read == True
        ).delete()
        
        # Clean up expired sessions
        expired_sessions = db.session.query(User).filter(
            User.reset_token_expires < datetime.utcnow()
        ).update({'reset_token': None, 'reset_token_expires': None})
        
        db.session.commit()
        
        return jsonify({
            'message': 'System cleanup completed',
            'cleaned_notifications': old_notifications,
            'cleaned_sessions': expired_sessions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create admin user
@admin_bp.route('/create-admin', methods=['POST'])
def create_admin_user():
    try:
        # Check if admin already exists
        admin_exists = User.query.filter_by(user_type=UserType.ADMIN).first()
        if admin_exists:
            return jsonify({'error': 'Admin user already exists'}), 400
        
        data = request.get_json()
        
        # Create admin user
        from werkzeug.security import generate_password_hash
        admin_user = User(
            username=data.get('username', 'admin'),
            email=data.get('email', 'admin@odontoturismo.com'),
            password_hash=generate_password_hash(data.get('password', 'admin123')),
            user_type=UserType.ADMIN,
            is_active=True,
            email_verified=True
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        return jsonify({'message': 'Admin user created successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 