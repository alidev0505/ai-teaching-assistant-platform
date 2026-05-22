from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.models import CourseFeedback, Course

student_bp = Blueprint('student', __name__)

# --- SUBMIT FEEDBACK ROUTE ---
@student_bp.route('/course/<int:course_id>/feedback', methods=['POST'])
@jwt_required()
def submit_feedback(course_id):
    identity = get_jwt_identity()
    
    if isinstance(identity, dict):
        current_user_id = identity.get('id')
    else:
        current_user_id = identity
        
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid user ID in token'}), 401

    data = request.get_json() or {}
    rating = data.get('rating')
    comment = data.get('comment', '').strip()

    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid parameter. Rating must be an integer between 1 and 5.'}), 400

    from app.models.models import Enrollment
    is_enrolled = Enrollment.query.filter_by(student_id=current_user_id, course_id=course_id).first()
    if not is_enrolled:
        return jsonify({'error': 'Access denied. You must be actively enrolled in this section to submit feedback.'}), 403

    # Check if already submitted
    existing = CourseFeedback.query.filter_by(course_id=course_id, student_id=current_user_id).first()
    if existing:
        return jsonify({'error': 'You have already rated this course.'}), 400

    # Save Feedback
    try:
        new_feedback = CourseFeedback(
            course_id=course_id,
            student_id=current_user_id,
            rating=rating, # Clean, validated parameter
            comment=comment[:500] # Cap comments at 500 characters to protect against string buffer bloat
        )
        db.session.add(new_feedback)
        db.session.commit()
        return jsonify({'message': 'Feedback submitted successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to log feedback submission entries securely.'}), 500