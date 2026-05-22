import random # Add this
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from app.models.models import db, User, Course, Material
from app.services.pdf_service import PDFService
from app.services.rag_service import RAGService

upload_bp = Blueprint('upload', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@upload_bp.route('/course', methods=['POST'])
@jwt_required()
def create_course():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Course name required'}), 400
        
    # Generate unique 4-digit code
    while True:
        code = str(random.randint(1000, 9999))
        if not Course.query.filter_by(class_code=code).first():
            break
            
    new_course = Course(name=data['name'], teacher_id=user.id, class_code=code)
    
    db.session.add(new_course)
    db.session.commit()
    
    return jsonify({
        'message': 'Course created', 
        'course': {
            'id': new_course.id,
            'name': new_course.name,
            'class_code': new_course.class_code
        }
    }), 201

@upload_bp.route('/material', methods=['POST'])
@jwt_required()
def upload_material():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can upload materials'}), 403
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    course_id = request.form.get('course_id')
    title = request.form.get('title')
    
    if not course_id or not title:
        return jsonify({'error': 'Course ID and title are required'}), 400
    
    try:
        course_id = int(course_id_raw)
    except (ValueError, TypeError):
        return jsonify({'error': 'Malformed course identifier parameters.'}), 400
    
    # Verify course belongs to teacher
    course = Course.query.get(course_id)
    if not course or course.teacher_id != user_id:
        return jsonify({'error': 'Course not found or unauthorized'}), 404
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Save file
    filename = secure_filename(file.filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    file_path = os.path.join(upload_folder, f"{course_id}_{filename}")
    file.save(file_path)
    
    # Create material record
    material = Material(
        course_id=course_id,
        title=title,
        file_path=file_path,
        file_type=filename.rsplit('.', 1)[1].lower(),
        is_processed=False
    )
    
    db.session.add(material)
    db.session.commit()
    
    # Process PDF in background (for now, do it synchronously)
    if material.file_type == 'pdf':
        try:
            # Extract text
            pdf_service = PDFService()
            text = pdf_service.extract_text_from_pdf(file_path)
            
            if text:
                # Chunk text
                chunks = pdf_service.chunk_text(text)
                
                # Create embeddings
                rag_service = RAGService()
                rag_service.create_embeddings(chunks, material.id)
                
                # Update material status
                material.is_processed = True
                db.session.commit()
        
        except Exception as e:
            print(f"Error processing PDF: {e}")
    
    return jsonify({
        'message': 'Material uploaded successfully',
        'material': {
            'id': material.id,
            'title': material.title,
            'file_type': material.file_type,
            'is_processed': material.is_processed
        }
    }), 201

@upload_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Teachers see their own courses
    if user.role == 'teacher':
        courses = Course.query.filter_by(teacher_id=user.id).all()
    # Students see courses they are enrolled in
    else:
        # Get courses from enrollments
        courses = [e.course for e in user.enrollments]
        
    return jsonify({
        'courses': [{
            'id': c.id,
            'name': c.name,
            'is_processed': True, # Keep existing logic
            'class_code': c.class_code  # <--- THIS WAS MISSING
        } for c in courses]
    }), 200

@upload_bp.route('/materials/<int:course_id>', methods=['GET'])
@jwt_required()
def get_materials(course_id):
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid security signature context'}), 401

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    from app.models.models import User, Enrollment
    user = User.query.get(user_id)
    
    if user.role == 'teacher':
        # Verify this teacher actually owns the requested course section
        if course.teacher_id != user_id:
            return jsonify({'error': 'Access denied. You are not the assigned instructor for this section.'}), 403
    else:
        # Verify the student is actively enrolled in this specific course section
        is_enrolled = Enrollment.query.filter_by(student_id=user_id, course_id=course_id).first()
        if not is_enrolled:
            return jsonify({'error': 'Access denied. You must be actively enrolled to view these materials.'}), 403
        
    materials = Material.query.filter_by(course_id=course_id).all()
    
    return jsonify({
        'course_name': course.name,
        'student_count': len(course.enrollments),
        'materials': [{
            'id': m.id,
            'title': m.title,
            'file_type': m.file_type,
            'is_processed': m.is_processed,
            'uploaded_at': m.uploaded_at.isoformat() if m.uploaded_at else None
        } for m in materials]
    }), 200