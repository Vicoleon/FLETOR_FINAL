# Database

SQLite database with complete schema for the dental tourism platform.

## Files

- `dental_tourism.db` - Pre-populated SQLite database (ready to use)
- `database_schema.sql` - Complete SQL schema for other database systems

## Database Schema

### Core Tables
- `user` - Authentication and user management
- `patient` - Patient profiles and information
- `dentist` - Dentist profiles and clinic details
- `dental_package` - Treatment packages and pricing
- `booking` - Uber-like booking system with full lifecycle
- `notification` - Real-time notification system
- `message` - Patient-dentist communication
- `review` - Rating and review system
- `user_session` - Enhanced session management

### Key Features
- **Booking Status Tracking:** PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
- **Real-time Notifications:** Complete notification types for all events
- **Performance Optimized:** 15+ indexes for fast queries
- **Uber-like Features:** Enhanced booking fields and status management

## Usage

### SQLite (Default)
The `dental_tourism.db` file is ready to use. Just place it in your Flask app's `instance/` folder.

### Other Databases
Use `database_schema.sql` to create the schema in PostgreSQL, MySQL, or other databases.

### Sample Data
The database includes test data:
- Sample patients and dentists
- Example dental packages
- Test bookings and notifications

## Schema Highlights

### Booking System
```sql
CREATE TABLE booking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    dentist_id INTEGER NOT NULL,
    package_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- ... additional fields
);
```

### Notification System
```sql
CREATE TABLE notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance
- Optimized indexes for real-time queries
- Composite indexes for Uber-like pending request queue
- Special indexes for notification system performance

