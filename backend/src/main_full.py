import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from sqlalchemy import inspect # ADDED LINE

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db, Procedure  # Add Procedure import
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.packages import packages_bp
from src.routes.bookings import bookings_bp
from src.routes.notifications import notifications_bp
from src.routes.admin import admin_bp
from src.routes.treatments import treatments_bp
from src.models.user import TreatmentType # ADDED IMPORT

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
app.register_blueprint(treatments_bp, url_prefix='/api/treatments')

# Enable database functionality - environment-aware
db_file_path = None # Initialize db_file_path
if os.environ.get('DATABASE_URL'):
    # Production database (PostgreSQL on Render)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    print(f"Using DATABASE_URL from environment: {app.config['SQLALCHEMY_DATABASE_URI']}")
else:
    # Development database (SQLite)
    # Ensure the database is in the instance folder
    instance_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        print(f"Created instance folder at: {instance_path}")
    db_file_path = os.path.join(instance_path, "dental_tourism.db") # Store this
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_file_path}'
    print(f"Using SQLite database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
print("Database initialized with Flask app.")

def seed_default_treatments():
    """Seeds the database with default treatment types if they don't exist."""
    default_treatments = [
        {"name": "General Check-up", "description": "Routine dental examination and cleaning.", "is_system_default": True},
        {"name": "Teeth Whitening", "description": "Professional teeth whitening procedure.", "is_system_default": True},
        {"name": "Fillings", "description": "Repairing cavities with dental fillings.", "is_system_default": True},
        {"name": "Root Canal Therapy", "description": "Treatment for infected tooth pulp.", "is_system_default": True},
        {"name": "Dental Implants", "description": "Artificial tooth root placement.", "is_system_default": True},
        {"name": "Crowns and Bridges", "description": "Restoring damaged teeth with crowns or bridges.", "is_system_default": True},
        {"name": "Orthodontics (Braces)", "description": "Straightening misaligned teeth.", "is_system_default": True},
        {"name": "Extractions", "description": "Removal of damaged or problematic teeth.", "is_system_default": True},
        {"name": "Dentures", "description": "Removable replacements for missing teeth.", "is_system_default": True},
        {"name": "Pediatric Dentistry", "description": "Dental care for children.", "is_system_default": True}
    ]

    try:
        # Check if any system default treatments already exist
        existing_system_treatments = TreatmentType.query.filter_by(is_system_default=True).first()
        if not existing_system_treatments:
            print("No system default treatments found. Seeding default treatments...")
            for treat_data in default_treatments:
                # Check if a treatment with the same name already exists to be safe
                exists = TreatmentType.query.filter_by(name=treat_data["name"]).first()
                if not exists:
                    treatment = TreatmentType(
                        name=treat_data["name"],
                        description=treat_data["description"],
                        is_system_default=treat_data["is_system_default"],
                        is_active=True # All defaults are active
                        # created_by is nullable, so it will be None for system defaults
                    )
                    db.session.add(treatment)
            db.session.commit()
            print(f"{len(default_treatments)} default treatment types seeded.")
        else:
            print("System default treatments already exist. Skipping seeding.")
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding default treatments: {e}")

def seed_default_procedures():
    """Seeds the database with default procedures if they don't exist."""
    default_procedures = [
        {"name": "Cleaning", "description": "Professional dental cleaning."},
        {"name": "Whitening", "description": "Teeth whitening procedure."},
        {"name": "X-ray", "description": "Dental X-ray imaging."}
    ]
    try:
        for proc in default_procedures:
            exists = Procedure.query.filter_by(name=proc["name"]).first()
            if not exists:
                procedure = Procedure(
                    name=proc["name"],
                    description=proc["description"],
                    is_active=True
                )
                db.session.add(procedure)
        db.session.commit()
        print(f"Default procedures seeded.")
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding default procedures: {e}")

# Create tables within app context
with app.app_context():
    print("Attempting to create database tables...")
    # db.drop_all() # Make sure this is commented out or removed for regular operation
    db.create_all()
    print("db.create_all() executed.")
    seed_default_treatments() # ADDED CALL TO SEEDER
    seed_default_procedures()

    # Verify database file existence if SQLite
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite:///') and db_file_path:
        if os.path.exists(db_file_path):
            print(f"SUCCESS: Database file found at {db_file_path}")
        else:
            print(f"FAILURE: Database file NOT found at {db_file_path}")

print("Database setup complete.")

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
