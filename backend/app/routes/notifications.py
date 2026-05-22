from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import db, Notification

notify_bp = Blueprint('notifications', __name__)

@notify_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid security signature structure'}), 401

    # Get last 10 notifications
    notifs = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).limit(10).all()
        
    return jsonify({
        'notifications': [{
            'id': n.id,
            'message': n.message,
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%Y-%m-%d %H:%M')
        } for n in notifs]
    }), 200

@notify_bp.route('/mark-read/<int:id>', methods=['PUT'])
@jwt_required()
def mark_read(id):
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid security signature structure'}), 401

    notif = Notification.query.get(id)
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    if notif.user_id != user_id:
        return jsonify({'error': 'Access denied. Unauthorized operation parameter.'}), 403

    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked read successfully'}), 200