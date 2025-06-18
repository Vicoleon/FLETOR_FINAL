from flask import Blueprint, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from src.models.user import db, Review, Booking, Patient, Dentist, BookingStatus
from src.routes.auth import token_required
from datetime import datetime

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/create', methods=['POST'])
@token_required
def create_review(current_user):
    """Create a new review for a completed booking"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['booking_id', 'rating', 'comment']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate rating range
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        # Get the booking
        booking = Booking.query.get(data['booking_id'])
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Verify the booking belongs to the current user (patient)
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient or booking.patient_id != patient.id:
            return jsonify({'error': 'Unauthorized to review this booking'}), 403
        
        # Verify the booking is completed
        if booking.status != BookingStatus.COMPLETED:
            return jsonify({'error': 'Can only review completed bookings'}), 400
        
        # Check if review already exists
        existing_review = Review.query.filter_by(booking_id=booking.id).first()
        if existing_review:
            return jsonify({'error': 'Review already exists for this booking'}), 400
        
        # Create the review
        review = Review(
            patient_id=patient.id,
            dentist_id=booking.dentist_id,
            booking_id=booking.id,
            rating=rating,
            comment=data['comment'],
            is_moderated=False,  # Reviews need moderation
            is_approved=False,
            created_at=datetime.utcnow()
        )
        
        db.session.add(review)
        db.session.commit()
        
        # Update dentist's average rating
        update_dentist_rating(booking.dentist_id)
        
        return jsonify({
            'message': 'Review submitted successfully. It will be visible after moderation.',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/dentist/<int:dentist_id>', methods=['GET'])
def get_dentist_reviews(dentist_id):
    """Get all approved reviews for a dentist"""
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Get approved reviews only
        reviews_query = Review.query.filter_by(
            dentist_id=dentist_id,
            is_approved=True
        ).order_by(Review.created_at.desc())
        
        reviews_paginated = reviews_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        reviews_data = []
        for review in reviews_paginated.items:
            review_dict = review.to_dict()
            # Add patient name (first name only for privacy)
            patient = Patient.query.get(review.patient_id)
            if patient:
                review_dict['patient_name'] = patient.first_name
            reviews_data.append(review_dict)
        
        return jsonify({
            'reviews': reviews_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': reviews_paginated.total,
                'pages': reviews_paginated.pages,
                'has_next': reviews_paginated.has_next,
                'has_prev': reviews_paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/pending', methods=['GET'])
@token_required
def get_pending_reviews(current_user):
    """Get pending reviews for admin moderation"""
    try:
        # Check if user is admin
        if current_user.user_type.value != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get pending reviews
        reviews_query = Review.query.filter_by(
            is_moderated=False
        ).order_by(Review.created_at.asc())
        
        reviews_paginated = reviews_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        reviews_data = []
        for review in reviews_paginated.items:
            review_dict = review.to_dict()
            
            # Add patient and dentist info
            patient = Patient.query.get(review.patient_id)
            dentist = Dentist.query.get(review.dentist_id)
            booking = Booking.query.get(review.booking_id)
            
            if patient:
                review_dict['patient'] = {
                    'name': f"{patient.first_name} {patient.last_name}",
                    'email': patient.user.email if patient.user else None
                }
            
            if dentist:
                review_dict['dentist'] = {
                    'name': f"Dr. {dentist.first_name} {dentist.last_name}",
                    'clinic': dentist.clinic_name
                }
            
            if booking:
                review_dict['booking'] = {
                    'package_name': booking.package.name if booking.package else None,
                    'completed_date': booking.actual_end_date.isoformat() if booking.actual_end_date else None
                }
            
            reviews_data.append(review_dict)
        
        return jsonify({
            'reviews': reviews_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': reviews_paginated.total,
                'pages': reviews_paginated.pages,
                'has_next': reviews_paginated.has_next,
                'has_prev': reviews_paginated.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/<int:review_id>/moderate', methods=['POST'])
@token_required
def moderate_review(current_user, review_id):
    """Approve or reject a review (admin only)"""
    try:
        # Check if user is admin
        if current_user.user_type.value != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        admin_notes = data.get('admin_notes', '')
        
        if action not in ['approve', 'reject']:
            return jsonify({'error': 'Action must be approve or reject'}), 400
        
        # Get the review
        review = Review.query.get(review_id)
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Update review status
        review.is_moderated = True
        review.is_approved = (action == 'approve')
        review.admin_notes = admin_notes
        review.moderated_at = datetime.utcnow()
        review.moderated_by = current_user.id
        
        db.session.commit()
        
        # Update dentist rating if approved
        if action == 'approve':
            update_dentist_rating(review.dentist_id)
        
        return jsonify({
            'message': f'Review {action}d successfully',
            'review': review.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/<int:review_id>/respond', methods=['POST'])
@token_required
def respond_to_review(current_user, review_id):
    """Allow dentist to respond to a review"""
    try:
        data = request.get_json()
        response_text = data.get('response')
        
        if not response_text:
            return jsonify({'error': 'Response text is required'}), 400
        
        # Get the review
        review = Review.query.get(review_id)
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        # Verify the dentist owns this review
        dentist = Dentist.query.filter_by(user_id=current_user.id).first()
        if not dentist or review.dentist_id != dentist.id:
            return jsonify({'error': 'Unauthorized to respond to this review'}), 403
        
        # Check if review is approved
        if not review.is_approved:
            return jsonify({'error': 'Cannot respond to unapproved review'}), 400
        
        # Update review with response
        review.dentist_response = response_text
        review.response_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Response added successfully',
            'review': review.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@reviews_bp.route('/stats/<int:dentist_id>', methods=['GET'])
def get_review_stats(dentist_id):
    """Get review statistics for a dentist"""
    try:
        # Get approved reviews only
        reviews = Review.query.filter_by(
            dentist_id=dentist_id,
            is_approved=True
        ).all()
        
        if not reviews:
            return jsonify({
                'total_reviews': 0,
                'average_rating': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }), 200
        
        # Calculate statistics
        total_reviews = len(reviews)
        total_rating = sum(review.rating for review in reviews)
        average_rating = round(total_rating / total_reviews, 1)
        
        # Rating distribution
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_distribution[review.rating] += 1
        
        return jsonify({
            'total_reviews': total_reviews,
            'average_rating': average_rating,
            'rating_distribution': rating_distribution
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def update_dentist_rating(dentist_id):
    """Update dentist's average rating based on approved reviews"""
    try:
        approved_reviews = Review.query.filter_by(
            dentist_id=dentist_id,
            is_approved=True
        ).all()
        
        dentist = Dentist.query.get(dentist_id)
        if not dentist:
            return
        
        if approved_reviews:
            total_rating = sum(review.rating for review in approved_reviews)
            average_rating = total_rating / len(approved_reviews)
            dentist.rating = round(average_rating, 1)
            dentist.total_reviews = len(approved_reviews)
        else:
            dentist.rating = 0.0
            dentist.total_reviews = 0
        
        db.session.commit()
        
    except Exception as e:
        print(f"Error updating dentist rating: {e}")
        db.session.rollback()

