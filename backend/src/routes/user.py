from flask import Blueprint, jsonify, request
from src.models.user import User, db, UserType
from werkzeug.security import generate_password_hash

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('username'):
            return jsonify({'error': 'username is required'}), 400
        if not data.get('email'):
            return jsonify({'error': 'email is required'}), 400
        if not data.get('password'):
            return jsonify({'error': 'password is required'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == data['username']) | (User.email == data['email'])
        ).first()
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Set user_type (default to patient if not provided)
        user_type_str = data.get('user_type', 'patient').lower()
        if user_type_str == 'dentist':
            user_type = UserType.DENTIST
        elif user_type_str == 'admin':
            user_type = UserType.ADMIN
        else:
            user_type = UserType.PATIENT  # Default
        
        # Create user with all required fields
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            user_type=user_type
        )
        
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        
        if data.get('username'):
            user.username = data['username']
        if data.get('email'):
            user.email = data['email']
        if data.get('password'):
            user.password_hash = generate_password_hash(data['password'])
        
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
