from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Initialize CORS
CORS(app)

# Simple in-memory storage for demo
users = []
packages = [
    {
        'id': 1,
        'name': 'Complete Smile Makeover',
        'description': 'Full dental restoration with veneers and whitening',
        'price_usd': 1200.00,
        'duration_days': 7,
        'procedures_included': ['Dental Veneers', 'Teeth Whitening', 'Dental Cleaning']
    },
    {
        'id': 2,
        'name': 'Dental Implants Package',
        'description': 'Single or multiple dental implants with crown',
        'price_usd': 800.00,
        'duration_days': 5,
        'procedures_included': ['Dental Implants', 'Crown Placement', 'Follow-up Care']
    }
]

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Check if user exists
        for user in users:
            if user['username'] == data['username']:
                return jsonify({'error': 'Username already exists'}), 400
            if user['email'] == data['email']:
                return jsonify({'error': 'Email already exists'}), 400
        
        # Create user
        user = {
            'id': len(users) + 1,
            'username': data['username'],
            'email': data['email'],
            'password': data['password'],  # In production, hash this
            'user_type': data.get('user_type', 'patient'),
            'first_name': data.get('first_name', ''),
            'last_name': data.get('last_name', ''),
            'phone': data.get('phone', ''),
            'country': data.get('country', '')
        }
        users.append(user)
        
        return jsonify({'message': 'User registered successfully', 'user_id': user['id']}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        for user in users:
            if user['username'] == data['username'] and user['password'] == data['password']:
                return jsonify({
                    'message': 'Login successful',
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email'],
                        'user_type': user['user_type']
                    },
                    'token': f'simple-token-{user["id"]}'
                }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/packages/', methods=['GET'])
def get_packages():
    return jsonify(packages), 200

@app.route('/api/bookings/', methods=['POST'])
def create_booking():
    try:
        data = request.get_json()
        booking = {
            'id': 1,
            'package_id': data['package_id'],
            'status': 'pending',
            'preferred_date': data.get('preferred_date'),
            'total_amount': data['total_amount'],
            'special_requests': data.get('special_requests', ''),
            'created_at': '2025-06-08T16:42:00Z'
        }
        return jsonify(booking), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/my-bookings', methods=['GET'])
def get_my_bookings():
    return jsonify([]), 200

@app.route('/api/notifications/', methods=['GET'])
def get_notifications():
    return jsonify([]), 200

@app.route('/api/notifications/unread-count', methods=['GET'])
def get_unread_count():
    return jsonify({'count': 0}), 200

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'Dental Tourism API is running!'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

