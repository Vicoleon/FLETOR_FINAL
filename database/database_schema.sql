-- =====================================================
-- DENTAL TOURISM PLATFORM - DATABASE SCHEMA
-- Complete SQL Schema for Manual Database Setup
-- =====================================================

-- Create database (for PostgreSQL/MySQL)
-- CREATE DATABASE dental_tourism;
-- USE dental_tourism;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'dentist', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    
    -- Enhanced authentication fields
    email_verified BOOLEAN DEFAULT 0,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE patient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(50),
    date_of_birth DATE,
    medical_history TEXT,
    emergency_contact VARCHAR(100),
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- DENTISTS TABLE
-- =====================================================
CREATE TABLE dentist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    years_experience INTEGER,
    clinic_name VARCHAR(100),
    clinic_address TEXT,
    phone VARCHAR(20),
    bio TEXT,
    rating REAL DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- DENTAL PACKAGES TABLE
-- =====================================================
CREATE TABLE dental_package (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dentist_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    procedures_included TEXT, -- JSON format: ["procedure1", "procedure2"]
    price_usd REAL NOT NULL,
    duration_days INTEGER,
    includes_accommodation BOOLEAN DEFAULT 0,
    includes_transportation BOOLEAN DEFAULT 0,
    max_patients INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (dentist_id) REFERENCES dentist(id) ON DELETE CASCADE
);

-- =====================================================
-- BOOKINGS TABLE (Uber-like System)
-- =====================================================
CREATE TABLE booking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    dentist_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'declined')),
    preferred_date DATE,
    confirmed_date DATE,
    total_amount REAL NOT NULL,
    special_requests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Enhanced booking fields for Phase 5
    declined_reason TEXT,
    cancellation_reason TEXT,
    estimated_duration INTEGER, -- in days
    actual_start_date DATE,
    actual_end_date DATE,
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES dentist(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES dental_package(id) ON DELETE CASCADE
);

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    dentist_id INTEGER NOT NULL,
    booking_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (dentist_id) REFERENCES dentist(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES booking(id) ON DELETE CASCADE
);

-- =====================================================
-- NOTIFICATIONS TABLE (Real-time System)
-- =====================================================
CREATE TABLE notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('booking_request', 'booking_confirmed', 'booking_declined', 'booking_cancelled', 'booking_updated', 'message_received', 'review_received', 'system')),
    is_read BOOLEAN DEFAULT 0,
    related_id INTEGER, -- ID of related object (booking, message, etc.)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- USER SESSIONS TABLE (Enhanced Authentication)
-- =====================================================
CREATE TABLE user_session (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45), -- IPv6 compatible
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_user_username ON user(username);
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_type ON user(user_type);

-- Patient indexes
CREATE INDEX idx_patient_user_id ON patient(user_id);

-- Dentist indexes
CREATE INDEX idx_dentist_user_id ON dentist(user_id);
CREATE INDEX idx_dentist_license ON dentist(license_number);
CREATE INDEX idx_dentist_verified ON dentist(is_verified);

-- Package indexes
CREATE INDEX idx_package_dentist_id ON dental_package(dentist_id);
CREATE INDEX idx_package_active ON dental_package(is_active);

-- Booking indexes (Critical for Uber-like performance)
CREATE INDEX idx_booking_patient_id ON booking(patient_id);
CREATE INDEX idx_booking_dentist_id ON booking(dentist_id);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_booking_created_at ON booking(created_at);
CREATE INDEX idx_booking_status_dentist ON booking(status, dentist_id); -- For pending requests

-- Notification indexes (Critical for real-time performance)
CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_is_read ON notification(is_read);
CREATE INDEX idx_notification_user_unread ON notification(user_id, is_read); -- For unread counts
CREATE INDEX idx_notification_created_at ON notification(created_at);

-- Message indexes
CREATE INDEX idx_message_booking_id ON message(booking_id);
CREATE INDEX idx_message_sender_id ON message(sender_id);

-- Session indexes
CREATE INDEX idx_session_user_id ON user_session(user_id);
CREATE INDEX idx_session_token ON user_session(session_token);
CREATE INDEX idx_session_expires ON user_session(expires_at);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample users
INSERT INTO user (username, email, password_hash, user_type) VALUES
('testpatient', 'patient@test.com', 'hashed_password_here', 'patient'),
('testdentist', 'dentist@test.com', 'hashed_password_here', 'dentist');

-- Insert sample patient
INSERT INTO patient (user_id, first_name, last_name, phone, country) VALUES
(1, 'John', 'Patient', '+1-555-123-4567', 'United States');

-- Insert sample dentist
INSERT INTO dentist (user_id, first_name, last_name, license_number, specialization, clinic_name, is_verified) VALUES
(2, 'Dr. Maria', 'Rodriguez', 'CR-DENT-001', 'Cosmetic Dentistry', 'Costa Rica Dental Center', 1);

-- Insert sample package
INSERT INTO dental_package (dentist_id, name, description, procedures_included, price_usd, duration_days) VALUES
(1, 'Complete Smile Makeover', 'Full dental restoration with veneers and whitening', '["Dental Veneers", "Teeth Whitening", "Dental Cleaning"]', 1200.00, 7);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update booking updated_at timestamp
CREATE TRIGGER update_booking_timestamp 
    AFTER UPDATE ON booking
    FOR EACH ROW
    BEGIN
        UPDATE booking SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for pending booking requests (Uber-like queue)
CREATE VIEW pending_booking_requests AS
SELECT 
    b.id,
    b.patient_id,
    b.dentist_id,
    b.package_id,
    b.preferred_date,
    b.total_amount,
    b.special_requests,
    b.created_at,
    p.first_name as patient_first_name,
    p.last_name as patient_last_name,
    p.phone as patient_phone,
    pkg.name as package_name,
    pkg.description as package_description
FROM booking b
JOIN patient p ON b.patient_id = p.id
JOIN dental_package pkg ON b.package_id = pkg.id
WHERE b.status = 'pending'
ORDER BY b.created_at ASC;

-- View for unread notifications count
CREATE VIEW unread_notifications_count AS
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM notification
WHERE is_read = 0
GROUP BY user_id;

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================

/*
1. This schema is designed for SQLite (included in the backend package)
2. For PostgreSQL/MySQL, adjust data types:
   - AUTOINCREMENT -> SERIAL (PostgreSQL) or AUTO_INCREMENT (MySQL)
   - BOOLEAN -> BOOLEAN (PostgreSQL) or TINYINT(1) (MySQL)
   - DATETIME -> TIMESTAMP
   
3. The schema supports the complete Uber-like functionality:
   - Real-time booking requests
   - Status tracking through entire lifecycle
   - Notification system with types
   - Enhanced authentication
   - Performance indexes for real-time queries

4. Key features implemented:
   - Booking status: pending -> confirmed -> in_progress -> completed
   - Notification types for all booking events
   - User session management
   - Review and rating system
   - Message system for patient-dentist communication

5. Performance optimizations:
   - Composite indexes for common queries
   - Separate indexes for real-time features
   - Views for frequently accessed data

6. The database is automatically created when running the Flask application
   - Tables are created via SQLAlchemy ORM
   - This SQL file is for reference and manual setup if needed
*/

