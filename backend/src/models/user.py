from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

db = SQLAlchemy()

class UserType(Enum):
    PATIENT = "patient"
    DENTIST = "dentist"
    ADMIN = "admin"

class BookingStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DECLINED = "declined"

class NotificationType(Enum):
    BOOKING_REQUEST = "booking_request"
    BOOKING_CONFIRMED = "booking_confirmed"
    BOOKING_DECLINED = "booking_declined"
    BOOKING_CANCELLED = "booking_cancelled"
    BOOKING_UPDATED = "booking_updated"
    MESSAGE_RECEIVED = "message_received"
    REVIEW_RECEIVED = "review_received"
    SYSTEM = "system"

# New models for treatments and specializations
class TreatmentType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # NULL for system-created
    is_system_default = db.Column(db.Boolean, default=False)  # True for pre-defined treatments
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'is_system_default': self.is_system_default,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Specialization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # NULL for system-created
    is_system_default = db.Column(db.Boolean, default=False)  # True for pre-defined specializations
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_by': self.created_by,
            'is_system_default': self.is_system_default,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

# Association tables for many-to-many relationships
dentist_specializations = db.Table('dentist_specializations',
    db.Column('dentist_id', db.Integer, db.ForeignKey('dentist.id'), primary_key=True),
    db.Column('specialization_id', db.Integer, db.ForeignKey('specialization.id'), primary_key=True)
)

package_treatments = db.Table('package_treatments',
    db.Column('package_id', db.Integer, db.ForeignKey('dental_package.id'), primary_key=True),
    db.Column('treatment_id', db.Integer, db.ForeignKey('treatment_type.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.Enum(UserType), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Enhanced authentication fields
    email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'user_type': self.user_type.value,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    country = db.Column(db.String(50))
    date_of_birth = db.Column(db.Date)
    medical_history = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))
    
    user = db.relationship('User', backref=db.backref('patient', uselist=False))
    bookings = db.relationship('Booking', backref='patient', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'country': self.country,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'medical_history': self.medical_history,
            'emergency_contact': self.emergency_contact
        }

class Dentist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    license_number = db.Column(db.String(50), unique=True, nullable=False)
    specialization = db.Column(db.String(100))  # Keep for backwards compatibility
    years_experience = db.Column(db.Integer)
    clinic_name = db.Column(db.String(100))
    clinic_address = db.Column(db.Text)
    phone = db.Column(db.String(20))
    bio = db.Column(db.Text)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)
    is_verified = db.Column(db.Boolean, default=False)
    
    user = db.relationship('User', backref=db.backref('dentist', uselist=False))
    packages = db.relationship('DentalPackage', backref='dentist', lazy=True)
    bookings = db.relationship('Booking', backref='dentist', lazy=True)
    
    # Many-to-many relationship with specializations
    specializations = db.relationship('Specialization', secondary=dentist_specializations, lazy='subquery',
                                    backref=db.backref('dentists', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'license_number': self.license_number,
            'specialization': self.specialization,
            'specializations': [spec.to_dict() for spec in self.specializations],
            'years_experience': self.years_experience,
            'clinic_name': self.clinic_name,
            'clinic_address': self.clinic_address,
            'phone': self.phone,
            'bio': self.bio,
            'rating': self.rating,
            'total_reviews': self.total_reviews,
            'is_verified': self.is_verified
        }

class DentalPackage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dentist_id = db.Column(db.Integer, db.ForeignKey('dentist.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    procedures_included = db.Column(db.JSON)  # Keep for backwards compatibility
    price_usd = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer)  # Treatment duration
    includes_accommodation = db.Column(db.Boolean, default=False)
    includes_transportation = db.Column(db.Boolean, default=False)
    max_patients = db.Column(db.Integer, default=1)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='package', lazy=True)
    
    # Many-to-many relationship with treatment types
    treatments = db.relationship('TreatmentType', secondary=package_treatments, lazy='subquery',
                               backref=db.backref('packages', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'dentist_id': self.dentist_id,
            'name': self.name,
            'description': self.description,
            'procedures_included': self.procedures_included,
            'treatments': [treatment.to_dict() for treatment in self.treatments],
            'price_usd': self.price_usd,
            'duration_days': self.duration_days,
            'includes_accommodation': self.includes_accommodation,
            'includes_transportation': self.includes_transportation,
            'max_patients': self.max_patients,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    dentist_id = db.Column(db.Integer, db.ForeignKey('dentist.id'), nullable=False)
    package_id = db.Column(db.Integer, db.ForeignKey('dental_package.id'), nullable=False)
    status = db.Column(db.Enum(BookingStatus), default=BookingStatus.PENDING)
    preferred_date = db.Column(db.Date)
    confirmed_date = db.Column(db.Date)
    total_amount = db.Column(db.Float, nullable=False)
    special_requests = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Enhanced booking fields
    declined_reason = db.Column(db.Text)
    cancellation_reason = db.Column(db.Text)
    estimated_duration = db.Column(db.Integer)  # in days
    actual_start_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    payment_status = db.Column(db.String(50), default='pending')  # pending, paid, refunded
    payment_method = db.Column(db.String(50))
    payment_reference = db.Column(db.String(100))
    
    messages = db.relationship('Message', backref='booking', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'dentist_id': self.dentist_id,
            'package_id': self.package_id,
            'status': self.status.value,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'confirmed_date': self.confirmed_date.isoformat() if self.confirmed_date else None,
            'total_amount': self.total_amount,
            'special_requests': self.special_requests,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'declined_reason': self.declined_reason,
            'cancellation_reason': self.cancellation_reason,
            'estimated_duration': self.estimated_duration,
            'actual_start_date': self.actual_start_date.isoformat() if self.actual_start_date else None,
            'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    sender = db.relationship('User', backref='sent_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    dentist_id = db.Column(db.Integer, db.ForeignKey('dentist.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    patient_rel = db.relationship('Patient', backref='reviews_given')
    dentist_rel = db.relationship('Dentist', backref='reviews_received')
    booking_rel = db.relationship('Booking', backref=db.backref('review', uselist=False))

    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'dentist_id': self.dentist_id,
            'booking_id': self.booking_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat()
        }


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum(NotificationType), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    related_id = db.Column(db.Integer)  # ID of related object (booking, message, etc.)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type.value,
            'is_read': self.is_read,
            'related_id': self.related_id,
            'created_at': self.created_at.isoformat()
        }

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    user = db.relationship('User', backref='sessions', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active
        }

