from flask import Blueprint, request, jsonify
from src.models.user import db, Booking, Patient, Dentist, DentalPackage, User, UserType, BookingStatus, Notification, NotificationType
from src.routes.auth import token_required
from datetime import datetime, timedelta

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/', methods=['POST'])
@token_required
def create_booking(current_user):
    """Create a new booking request (patients only) - Uber-like request system"""
    try:
        if current_user.user_type != UserType.PATIENT:
            return jsonify({'error': 'Only patients can create bookings'}), 403
        
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({'error': 'Patient profile not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['package_id', 'preferred_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate package exists
        package = DentalPackage.query.get(data['package_id'])
        if not package or not package.is_active:
            return jsonify({'error': 'Package not found or inactive'}), 404
        
        # Parse preferred date
        try:
            preferred_date = datetime.strptime(data['preferred_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Check if date is in the future
        if preferred_date <= datetime.now().date():
            return jsonify({'error': 'Preferred date must be in the future'}), 400
        
        # Create booking request
        booking = Booking(
            patient_id=patient.id,
            dentist_id=package.dentist_id,
            package_id=package.id,
            preferred_date=preferred_date,
            total_amount=package.price_usd,
            special_requests=data.get('special_requests', ''),
            status=BookingStatus.PENDING,
            estimated_duration=package.duration_days,
            payment_status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(booking)
        db.session.flush()  # Get the booking ID
        
        # Create notification for dentist (Uber-like notification)
        dentist = Dentist.query.get(package.dentist_id)
        if dentist:
            notification = Notification(
                user_id=dentist.user_id,
                type=NotificationType.BOOKING_REQUEST,
                title='New Booking Request',
                message=f'New booking request from {patient.first_name} {patient.last_name} for {package.name}',
                related_id=booking.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
        
        db.session.commit()
        
        # Get booking with related data
        booking_data = booking.to_dict()
        booking_data['package'] = package.to_dict()
        booking_data['patient'] = patient.to_dict()
        booking_data['dentist'] = dentist.to_dict() if dentist else None
        
        return jsonify({
            'message': 'Booking request sent successfully! The dentist will be notified.',
            'booking': booking_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/my-bookings', methods=['GET'])
@token_required
def get_my_bookings(current_user):
    """Get bookings for the authenticated user"""
    try:
        bookings = []
        
        if current_user.user_type == UserType.PATIENT:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if patient:
                bookings = Booking.query.filter_by(patient_id=patient.id).order_by(Booking.created_at.desc()).all()
        elif current_user.user_type == UserType.DENTIST:
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if dentist:
                bookings = Booking.query.filter_by(dentist_id=dentist.id).order_by(Booking.created_at.desc()).all()
        
        result = []
        for booking in bookings:
            booking_data = booking.to_dict()
            
            # Add package information
            package = DentalPackage.query.get(booking.package_id)
            if package:
                booking_data['package'] = package.to_dict()
            
            # Add patient information (for dentists)
            if current_user.user_type == UserType.DENTIST:
                patient = Patient.query.get(booking.patient_id)
                if patient:
                    booking_data['patient'] = patient.to_dict()
            
            # Add dentist information (for patients)
            if current_user.user_type == UserType.PATIENT:
                dentist = Dentist.query.get(booking.dentist_id)
                if dentist:
                    booking_data['dentist'] = dentist.to_dict()
            
            result.append(booking_data)
        
        return jsonify({'bookings': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@token_required
def get_booking(current_user, booking_id):
    """Get specific booking details"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check if user has access to this booking
        has_access = False
        if current_user.user_type == UserType.PATIENT:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if patient and booking.patient_id == patient.id:
                has_access = True
        elif current_user.user_type == UserType.DENTIST:
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if dentist and booking.dentist_id == dentist.id:
                has_access = True
        
        if not has_access:
            return jsonify({'error': 'Access denied'}), 403
        
        booking_data = booking.to_dict()
        
        # Add related information
        package = DentalPackage.query.get(booking.package_id)
        if package:
            booking_data['package'] = package.to_dict()
        
        patient = Patient.query.get(booking.patient_id)
        if patient:
            booking_data['patient'] = patient.to_dict()
        
        dentist = Dentist.query.get(booking.dentist_id)
        if dentist:
            booking_data['dentist'] = dentist.to_dict()
        
        return jsonify(booking_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/status', methods=['PUT'])
@token_required
def update_booking_status(current_user, booking_id):
    """Update booking status - Uber-like accept/decline system"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        data = request.get_json()
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        try:
            new_status = BookingStatus(data['status'])
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400
        
        # Check permissions and valid status transitions
        if current_user.user_type == UserType.DENTIST:
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if not dentist or booking.dentist_id != dentist.id:
                return jsonify({'error': 'Access denied'}), 403
            
            # Dentists can confirm, decline, start treatment, complete, or cancel
            allowed_statuses = [BookingStatus.CONFIRMED, BookingStatus.DECLINED, BookingStatus.IN_PROGRESS, 
                              BookingStatus.COMPLETED, BookingStatus.CANCELLED]
            if new_status not in allowed_statuses:
                return jsonify({'error': 'Invalid status for dentist'}), 400
                
        elif current_user.user_type == UserType.PATIENT:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if not patient or booking.patient_id != patient.id:
                return jsonify({'error': 'Access denied'}), 403
            
            # Patients can only cancel pending or confirmed bookings
            if new_status != BookingStatus.CANCELLED or booking.status in [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]:
                return jsonify({'error': 'Cannot cancel booking in current status'}), 400
        else:
            return jsonify({'error': 'Invalid user type'}), 403
        
        # Update booking
        old_status = booking.status
        booking.status = new_status
        booking.updated_at = datetime.utcnow()
        
        # Handle status-specific updates
        if new_status == BookingStatus.CONFIRMED and 'confirmed_date' in data:
            try:
                confirmed_date = datetime.strptime(data['confirmed_date'], '%Y-%m-%d').date()
                booking.confirmed_date = confirmed_date
            except ValueError:
                return jsonify({'error': 'Invalid confirmed_date format. Use YYYY-MM-DD'}), 400
        
        if new_status == BookingStatus.DECLINED and 'declined_reason' in data:
            booking.declined_reason = data['declined_reason']
        
        if new_status == BookingStatus.CANCELLED and 'cancellation_reason' in data:
            booking.cancellation_reason = data['cancellation_reason']
        
        if new_status == BookingStatus.IN_PROGRESS and 'actual_start_date' in data:
            try:
                actual_start_date = datetime.strptime(data['actual_start_date'], '%Y-%m-%d').date()
                booking.actual_start_date = actual_start_date
            except ValueError:
                return jsonify({'error': 'Invalid actual_start_date format. Use YYYY-MM-DD'}), 400
        
        if new_status == BookingStatus.COMPLETED and 'actual_end_date' in data:
            try:
                actual_end_date = datetime.strptime(data['actual_end_date'], '%Y-%m-%d').date()
                booking.actual_end_date = actual_end_date
            except ValueError:
                return jsonify({'error': 'Invalid actual_end_date format. Use YYYY-MM-DD'}), 400
        
        # Create notifications based on status change (Uber-like notifications)
        notification_user_id = None
        notification_message = ""
        notification_type = NotificationType.BOOKING_UPDATED
        
        if current_user.user_type == UserType.DENTIST:
            # Notify patient
            patient = Patient.query.get(booking.patient_id)
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if patient and dentist:
                notification_user_id = patient.user_id
                if new_status == BookingStatus.CONFIRMED:
                    notification_type = NotificationType.BOOKING_CONFIRMED
                    notification_message = f"Your booking request has been confirmed by Dr. {dentist.first_name} {dentist.last_name}"
                elif new_status == BookingStatus.DECLINED:
                    notification_type = NotificationType.BOOKING_DECLINED
                    notification_message = f"Your booking request has been declined by Dr. {dentist.first_name} {dentist.last_name}"
                elif new_status == BookingStatus.CANCELLED:
                    notification_type = NotificationType.BOOKING_CANCELLED
                    notification_message = f"Your booking has been cancelled by Dr. {dentist.first_name} {dentist.last_name}"
                elif new_status == BookingStatus.IN_PROGRESS:
                    notification_message = f"Your treatment has started with Dr. {dentist.first_name} {dentist.last_name}"
                elif new_status == BookingStatus.COMPLETED:
                    notification_message = f"Your treatment has been completed by Dr. {dentist.first_name} {dentist.last_name}"
        
        elif current_user.user_type == UserType.PATIENT:
            # Notify dentist
            dentist = Dentist.query.get(booking.dentist_id)
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if dentist and patient:
                notification_user_id = dentist.user_id
                notification_type = NotificationType.BOOKING_CANCELLED
                notification_message = f"Booking cancelled by patient {patient.first_name} {patient.last_name}"
        
        if notification_user_id and notification_message:
            notification = Notification(
                user_id=notification_user_id,
                type=notification_type,
                title='Booking Status Update',
                message=notification_message,
                related_id=booking.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking status updated successfully',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/pending-requests', methods=['GET'])
@token_required
def get_pending_requests(current_user):
    """Get pending booking requests for dentists - Uber-like request queue"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can access pending requests'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        pending_bookings = Booking.query.filter_by(
            dentist_id=dentist.id,
            status=BookingStatus.PENDING
        ).order_by(Booking.created_at.desc()).all()
        
        result = []
        for booking in pending_bookings:
            booking_data = booking.to_dict()
            
            # Add package and patient information
            package = DentalPackage.query.get(booking.package_id)
            if package:
                booking_data['package'] = package.to_dict()
            
            patient = Patient.query.get(booking.patient_id)
            if patient:
                booking_data['patient'] = patient.to_dict()
            
            # Add time since request (Uber-like feature)
            time_since = datetime.utcnow() - booking.created_at
            booking_data['time_since_request'] = {
                'minutes': int(time_since.total_seconds() / 60),
                'hours': int(time_since.total_seconds() / 3600),
                'days': time_since.days
            }
            
            result.append(booking_data)
        
        return jsonify({
            'pending_requests': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/accept', methods=['POST'])
@token_required
def accept_booking(current_user, booking_id):
    """Accept a booking request - Uber-like accept functionality"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can accept bookings'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking.dentist_id != dentist.id:
            return jsonify({'error': 'Access denied'}), 403
        
        if booking.status != BookingStatus.PENDING:
            return jsonify({'error': 'Booking is not pending'}), 400
        
        data = request.get_json()
        confirmed_date = data.get('confirmed_date')
        
        if not confirmed_date:
            return jsonify({'error': 'Confirmed date is required'}), 400
        
        try:
            confirmed_date = datetime.strptime(confirmed_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Update booking
        booking.status = BookingStatus.CONFIRMED
        booking.confirmed_date = confirmed_date
        booking.updated_at = datetime.utcnow()
        
        # Create notification for patient
        patient = Patient.query.get(booking.patient_id)
        if patient:
            notification = Notification(
                user_id=patient.user_id,
                type=NotificationType.BOOKING_CONFIRMED,
                title='Booking Confirmed!',
                message=f'Dr. {dentist.first_name} {dentist.last_name} has confirmed your booking for {confirmed_date.strftime("%B %d, %Y")}',
                related_id=booking.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking accepted successfully!',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/decline', methods=['POST'])
@token_required
def decline_booking(current_user, booking_id):
    """Decline a booking request - Uber-like decline functionality"""
    try:
        if current_user.user_type != UserType.DENTIST:
            return jsonify({'error': 'Only dentists can decline bookings'}), 403
        
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist:
            return jsonify({'error': 'Dentist profile not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        if booking.dentist_id != dentist.id:
            return jsonify({'error': 'Access denied'}), 403
        
        if booking.status != BookingStatus.PENDING:
            return jsonify({'error': 'Booking is not pending'}), 400
        
        data = request.get_json()
        declined_reason = data.get('reason', 'No reason provided')
        
        # Update booking
        booking.status = BookingStatus.DECLINED
        booking.declined_reason = declined_reason
        booking.updated_at = datetime.utcnow()
        
        # Create notification for patient
        patient = Patient.query.get(booking.patient_id)
        if patient:
            notification = Notification(
                user_id=patient.user_id,
                type=NotificationType.BOOKING_DECLINED,
                title='Booking Declined',
                message=f'Dr. {dentist.first_name} {dentist.last_name} has declined your booking request. Reason: {declined_reason}',
                related_id=booking.id,
                created_at=datetime.utcnow()
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking declined successfully',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/statistics', methods=['GET'])
@token_required
def get_booking_statistics(current_user):
    """Get booking statistics for the authenticated user"""
    try:
        stats = {}
        
        if current_user.user_type == UserType.PATIENT:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if patient:
                total_bookings = Booking.query.filter_by(patient_id=patient.id).count()
                pending_bookings = Booking.query.filter_by(patient_id=patient.id, status=BookingStatus.PENDING).count()
                confirmed_bookings = Booking.query.filter_by(patient_id=patient.id, status=BookingStatus.CONFIRMED).count()
                completed_bookings = Booking.query.filter_by(patient_id=patient.id, status=BookingStatus.COMPLETED).count()
                
                stats = {
                    'total_bookings': total_bookings,
                    'pending_bookings': pending_bookings,
                    'confirmed_bookings': confirmed_bookings,
                    'completed_bookings': completed_bookings
                }
        
        elif current_user.user_type == UserType.DENTIST:
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if dentist:
                total_bookings = Booking.query.filter_by(dentist_id=dentist.id).count()
                pending_requests = Booking.query.filter_by(dentist_id=dentist.id, status=BookingStatus.PENDING).count()
                confirmed_bookings = Booking.query.filter_by(dentist_id=dentist.id, status=BookingStatus.CONFIRMED).count()
                completed_bookings = Booking.query.filter_by(dentist_id=dentist.id, status=BookingStatus.COMPLETED).count()
                
                # Calculate total revenue from completed bookings
                completed_booking_objects = Booking.query.filter_by(
                    dentist_id=dentist.id, 
                    status=BookingStatus.COMPLETED
                ).all()
                total_revenue = sum(booking.total_amount for booking in completed_booking_objects)
                
                stats = {
                    'total_bookings': total_bookings,
                    'pending_requests': pending_requests,
                    'confirmed_bookings': confirmed_bookings,
                    'completed_bookings': completed_bookings,
                    'total_revenue': total_revenue,
                    'active_packages': DentalPackage.query.filter_by(dentist_id=dentist.id, is_active=True).count()
                }
        
        return jsonify({'statistics': stats}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bookings_bp.route('/<int:booking_id>/payment', methods=['PUT'])
@token_required
def update_payment_status(current_user, booking_id):
    """Update payment status for a booking"""
    try:
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Check access permissions
        has_access = False
        if current_user.user_type == UserType.PATIENT:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if patient and booking.patient_id == patient.id:
                has_access = True
        elif current_user.user_type == UserType.DENTIST:
            dentist = Dentist.query.filter_by(user_id=current_user.id).first()
            if dentist and booking.dentist_id == dentist.id:
                has_access = True
        
        if not has_access:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        payment_status = data.get('payment_status')
        payment_method = data.get('payment_method')
        payment_reference = data.get('payment_reference')
        
        if payment_status:
            booking.payment_status = payment_status
        if payment_method:
            booking.payment_method = payment_method
        if payment_reference:
            booking.payment_reference = payment_reference
        
        booking.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Payment status updated successfully',
            'booking': booking.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

