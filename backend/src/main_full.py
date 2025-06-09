import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.packages import packages_bp
from src.routes.bookings import bookings_bp
from src.routes.notifications import notifications_bp
from src.routes.admin import admin_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Environment-aware configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['DEBUG'] = os.environ.get('FLASK_ENV', 'development') == 'development'

# Enable CORS for all routes - configure for environment
if os.environ.get('FLASK_ENV') == 'production':
    # Production CORS - restrict to specific origins
    allowed_origins = [
        'https://odontotravel.onrender.com',
        'https://odontotravel-frontend.onrender.com'
    ]
    CORS(app, origins=allowed_origins, supports_credentials=True)
else:
    # Development CORS - allow all origins
    CORS(app)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(packages_bp, url_prefix='/api/packages')
app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Enable database functionality - environment-aware
if os.environ.get('DATABASE_URL'):
    # Production database (PostgreSQL on Render)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
else:
    # Development database (SQLite)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dental_tourism.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables within app context
with app.app_context():
    db.create_all()
    print("Database tables created successfully!")

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'Dental Tourism API is running'}, 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    # Environment-aware server configuration
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
