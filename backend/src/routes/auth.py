from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from src.models.user import db, User, Patient, Dentist, UserType, Notification
import jwt
import datetime
import secrets
import re
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

def validate_email(email):
    """Validate email format"""
    return EMAIL_REGEX.match(email) is not None

def create_notification(user_id, title, message, notification_type, related_id=None):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        related_id=related_id
    )
    db.session.add(notification)
    return notification

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'user_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Validate user type
        if data['user_type'] not in ['patient', 'dentist']:
            return jsonify({'error': 'Invalid user type'}), 400
        
        user_type_enum = UserType.PATIENT if data['user_type'] == 'patient' else UserType.DENTIST
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            user_type=user_type_enum,
            email_verified=False,
            verification_token=secrets.token_urlsafe(32)
        )
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create profile based on user type
        if data['user_type'] == 'patient':
            profile = Patient(
                user_id=user.id,
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                phone=data.get('phone', ''),
                country=data.get('country', ''),
                date_of_birth=data.get('date_of_birth'),
                medical_history=data.get('medical_history', ''),
                emergency_contact=data.get('emergency_contact', '')
            )
        else:  # dentist
            profile = Dentist(
                user_id=user.id,
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                phone=data.get('phone', ''),
                license_number=data.get('license_number', ''),
                specialization=data.get('specialization', ''),
                years_experience=data.get('years_experience', 0),
                clinic_name=data.get('clinic_name', ''),
                clinic_address=data.get('clinic_address', ''),
                bio=data.get('bio', ''),
                education=data.get('education', ''),
                certifications=data.get('certifications', ''),
                languages_spoken=data.get('languages_spoken', 'English,Spanish')
            )
        
        db.session.add(profile)
        db.session.commit()
        
        # Generate JWT token for automatic login
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'user_type': user.user_type.value,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, 'your-secret-key', algorithm='HS256')
        
        # Get profile data
        profile_data = {
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'phone': profile.phone,
        }
        
        if user.user_type == UserType.DENTIST:
            profile_data.update({
                'license_number': profile.license_number,
                'specialization': profile.specialization,
                'years_experience': profile.years_experience,
                'clinic_name': profile.clinic_name,
                'clinic_address': profile.clinic_address,
                'rating': 0.0,
                'total_reviews': 0
            })
        else:
            profile_data.update({
                'country': profile.country,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None
            })
        
        # TODO: Send verification email
        # send_verification_email(user.email, user.verification_token)
        
        return jsonify({
            'access_token': token,
            'token': token,  # For compatibility with frontend
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type.value,
                'email_verified': user.email_verified,
                'profile': profile_data
            },
            'message': 'User created successfully and logged in.',
            'verification_required': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['username'])
        ).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'user_type': user.user_type.value,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, 'your-secret-key', algorithm='HS256')
        
        # Get profile data
        profile_data = {}
        if user.user_type == UserType.PATIENT:
            profile = Patient.query.filter_by(user_id=user.id).first()
        else:
            profile = Dentist.query.filter_by(user_id=user.id).first()
        
        if profile:
            profile_data = {
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'phone': profile.phone,
            }
            
            if user.user_type == UserType.DENTIST:
                profile_data.update({
                    'license_number': profile.license_number,
                    'specialization': profile.specialization,
                    'years_experience': profile.years_experience,
                    'clinic_name': profile.clinic_name,
                    'clinic_address': profile.clinic_address,
                    'rating': profile.rating,
                    'total_reviews': profile.total_reviews
                })
            else:
                profile_data.update({
                    'country': profile.country,
                    'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None
                })
        
        return jsonify({
            'access_token': token,
            'token': token,  # For compatibility with frontend
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type.value,
                'email_verified': user.email_verified,
                'profile': profile_data,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Verification token is required'}), 400
        
        user = User.query.filter_by(verification_token=token).first()
        if not user:
            return jsonify({'error': 'Invalid verification token'}), 400
        
        user.email_verified = True
        user.verification_token = None
        db.session.commit()
        
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if email exists or not for security
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        db.session.commit()
        
        # TODO: Send password reset email
        # send_password_reset_email(user.email, reset_token)
        
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Validate password strength
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        user = User.query.filter_by(reset_token=token).first()
        if not user or not user.reset_token_expires or user.reset_token_expires < datetime.datetime.utcnow():
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        user.password_hash = generate_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        if not check_password_hash(current_user.password_hash, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password strength
        is_valid, message = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        current_user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        # Get profile data
        if current_user.user_type == UserType.PATIENT:
            profile = Patient.query.filter_by(user_id=current_user.id).first()
        else:
            profile = Dentist.query.filter_by(user_id=current_user.id).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        profile_data = {
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'user_type': current_user.user_type.value,
            'email_verified': current_user.email_verified,
            'is_active': current_user.is_active,
            'created_at': current_user.created_at.isoformat(),
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None,
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'phone': profile.phone,
        }
        
        if current_user.user_type == UserType.DENTIST:
            profile_data.update({
                'license_number': profile.license_number,
                'specialization': profile.specialization,
                'years_experience': profile.years_experience,
                'clinic_name': profile.clinic_name,
                'clinic_address': profile.clinic_address,
                'bio': profile.bio,
                'rating': profile.rating,
                'total_reviews': profile.total_reviews,
                'is_verified': profile.is_verified
            })
        else:
            profile_data.update({
                'country': profile.country,
                'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                'medical_history': profile.medical_history,
                'emergency_contact': profile.emergency_contact
            })
        
        return jsonify({'profile': profile_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        # Get profile
        if current_user.user_type == UserType.PATIENT:
            profile = Patient.query.filter_by(user_id=current_user.id).first()
        else:
            profile = Dentist.query.filter_by(user_id=current_user.id).first()
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Update basic fields
        if 'first_name' in data:
            profile.first_name = data['first_name']
        if 'last_name' in data:
            profile.last_name = data['last_name']
        if 'phone' in data:
            profile.phone = data['phone']
        
        # Update user email if provided
        if 'email' in data and data['email'] != current_user.email:
            if not validate_email(data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email already exists
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'error': 'Email already exists'}), 400
            
            current_user.email = data['email']
            current_user.email_verified = False  # Require re-verification
            current_user.verification_token = secrets.token_urlsafe(32)
        
        # Update type-specific fields
        if current_user.user_type == UserType.DENTIST:
            if 'license_number' in data:
                profile.license_number = data['license_number']
            if 'specialization' in data:
                profile.specialization = data['specialization']
            if 'years_experience' in data:
                profile.years_experience = data['years_experience']
            if 'clinic_name' in data:
                profile.clinic_name = data['clinic_name']
            if 'clinic_address' in data:
                profile.clinic_address = data['clinic_address']
            if 'bio' in data:
                profile.bio = data['bio']
        else:
            if 'country' in data:
                profile.country = data['country']
            if 'date_of_birth' in data:
                try:
                    profile.date_of_birth = datetime.datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
            if 'medical_history' in data:
                profile.medical_history = data['medical_history']
            if 'emergency_contact' in data:
                profile.emergency_contact = data['emergency_contact']
        
        db.session.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/deactivate', methods=['POST'])
@token_required
def deactivate_account(current_user):
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({'error': 'Password is required to deactivate account'}), 400
        
        if not check_password_hash(current_user.password_hash, password):
            return jsonify({'error': 'Incorrect password'}), 400
        
        current_user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Account deactivated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh_token(current_user):
    try:
        # Generate new JWT token
        token = jwt.encode({
            'user_id': current_user.id,
            'username': current_user.username,
            'user_type': current_user.user_type.value,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, 'your-secret-key', algorithm='HS256')
        
        return jsonify({'access_token': token}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        query = Notification.query.filter_by(user_id=current_user.id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications.items],
            'total': notifications.total,
            'pages': notifications.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': notifications.has_next,
            'has_prev': notifications.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@token_required
def mark_notification_read(current_user, notification_id):
    try:
        notification = Notification.query.filter_by(
            id=notification_id, 
            user_id=current_user.id
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_notifications_read(current_user):
    try:
        Notification.query.filter_by(
            user_id=current_user.id, 
            is_read=False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_notifications_count(current_user):
    try:
        count = Notification.query.filter_by(
            user_id=current_user.id, 
            is_read=False
        ).count()
        
        return jsonify({'unread_count': count}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

