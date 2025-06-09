# Backend API

Flask-based REST API for the dental tourism platform.

## Quick Start

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/<id>` - Update booking status
- `DELETE /api/bookings/<id>` - Cancel booking
- `GET /api/bookings/pending` - Get pending requests (dentists)

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read/<id>` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread count

### Packages
- `GET /api/packages` - Get dental packages
- `POST /api/packages` - Create package (dentists)

## Database Models

- `User` - Base user authentication
- `Patient` - Patient profiles
- `Dentist` - Dentist profiles
- `Booking` - Booking management
- `Notification` - Notification system
- `DentalPackage` - Treatment packages

## Configuration

- Database: SQLite (see `instance/dental_tourism.db`)
- JWT Secret: Configure in production
- CORS: Enabled for frontend integration

## Development

- Main application: `src/main.py`
- Models: `src/models/user.py`
- Routes: `src/routes/` directory
- Database migrations: Automatic with SQLAlchemy

