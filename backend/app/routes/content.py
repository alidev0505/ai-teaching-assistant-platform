from werkzeug.utils import secure_filename
from flask import send_file, Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import random
import string
import uuid
from datetime import datetime
from sqlalchemy import func
from flask import send_file

# Services and Models
from app.utils.text_extractor import extract_text_from_file
from app.services.export_service import ExportService
from app.services.rag_service import RAGService
from app.services.assessment_service import AssessmentService
from app.services.gemini_service import GeminiService
from app.services.course_file_service import CourseFileService
from app.models.models import db, User, Material, GeneratedContent, Assignment, Submission, Notification, Course, Semester, LiveSession, Attendance, Quiz, Question, QuizSubmission, ReportLog, Enrollment

content_bp = Blueprint('content', __name__)

@content_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_content():
    # Handle identity
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else int(current_user)
    user = User.query.get(user_id)
    
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can generate content'}), 403
    
    data = request.get_json()
    material_id = data.get('material_id')
    content_type = data.get('content_type') or data.get('type') 
    detailed_type = data.get('detailed_type')
    custom_prompt = data.get('custom_prompt')
    chat_history = data.get('chat_history')
    
    if not material_id or not content_type:
        return jsonify({'error': 'Material ID and content type are required'}), 400
    
    # Get material
    material = Material.query.get(material_id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    
    if not material.is_processed:
        return jsonify({'error': 'Material is still being processed'}), 400
    
    # Load RAG index
    rag_service = RAGService()
    if not rag_service.load_index(material_id):
        return jsonify({'error': 'Failed to load material index'}), 500
    
    # Generate content
    all_chunks = rag_service.chunks
    context = "\n\n".join(all_chunks[:1500])
    
    gemini_service = GeminiService()
    generated_text = gemini_service.generate_content(context, content_type, detailed_type, custom_prompt, chat_history)
    
    if not generated_text:
        return jsonify({'error': 'Failed to generate content'}), 500
    
    # Save to file
    generated_folder = current_app.config['GENERATED_FOLDER']
    os.makedirs(generated_folder, exist_ok=True)
    filename = f"{content_type}_{material_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    file_path = os.path.join(generated_folder, filename)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(generated_text)
    
    # ✅ SAVE TO DATABASE WITH course_id
    # This ensures the "AI Resources" tab can find it later
    content_record = GeneratedContent(
        material_id=material_id,
        course_id=material.course_id,  # Ensure this matches your models.py change
        content_type=content_type,
        content=generated_text,
        file_path=file_path
    )
    db.session.add(content_record)
    db.session.commit()

    # ANALYTICS TRACKING
    try:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        log_entry = ReportLog.query.filter_by(date=today_str).first()
        
        if log_entry:
            log_entry.generations += 1
            log_entry.users += 1 
        else:
            new_log = ReportLog(date=today_str, generations=1, users=1)
            db.session.add(new_log)
            
        db.session.commit()
    except Exception as e:
        print(f"Analytics Tracking Error: {e}")
        db.session.rollback()
    
    return jsonify({
        'message': 'Content generated successfully',
        'content_id': content_record.id,
        'content': generated_text,
        'preview': generated_text[:500] + "...",
        'course_id': material.course_id 
    }), 201

# ✅ ADD THIS NEW ROUTE: To fetch resources for the UI tab
@content_bp.route('/course/<int:course_id>/ai-resources', methods=['GET'])
@jwt_required()
def get_course_resources(course_id):
    try:
        resources = GeneratedContent.query.filter_by(course_id=course_id).order_by(GeneratedContent.created_at.desc()).all()
        return jsonify([{
            'id': r.id,
            'type': r.content_type,
            'content': r.content,
            'date': r.created_at.strftime('%Y-%m-%d %H:%M'),
            'material_id': r.material_id
        } for r in resources]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add this route for the dropdown
@content_bp.route('/semesters/active', methods=['GET'])
@jwt_required()
def get_active_semesters():
    semesters = Semester.query.filter_by(is_active=True).all()
    output = [{'id': s.id, 'name': f"{s.name} {s.academic_year}"} for s in semesters]
    return jsonify({'semesters': output}), 200

def generate_unique_code(length=4):
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        if not Course.query.filter_by(class_code=code).first():
            return code

# --- CREATE COURSE (With Semester Support) ---
@content_bp.route('/course', methods=['POST'])
@jwt_required()
def create_course():
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    user = User.query.get(user_id)
    
    if user.role != 'teacher':
        return jsonify({'error': 'Unauthorized. Only teachers can create courses.'}), 403

    data = request.get_json()
    
    if not data.get('name'):
        return jsonify({'error': 'Course Name is required'}), 400
    if not data.get('semester_id'):
        return jsonify({'error': 'Semester is required'}), 400

    try:
        new_course = Course(
            name=data['name'],
            description=data.get('description', ''),
            teacher_id=user_id,
            class_code=generate_unique_code(),
            semester_id=data['semester_id']
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        return jsonify({
            'message': 'Course created successfully', 
            'course': {
                'id': new_course.id,
                'name': new_course.name,
                'class_code': new_course.class_code
            }
        }), 201
        
    except Exception as e:
        print(f"Error creating course: {e}")
        return jsonify({'error': 'Failed to create course'}), 500
    
# --- GET COURSE DETAILS (Includes Student List) ---
@content_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_details(course_id):
    # 1. Get the course
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    # 2. Get the list of enrolled students
    # We look at the 'enrollments' list and grab the 'student' from each one
    students_list = []
    if course.enrollments:
        for enrollment in course.enrollments:
            if enrollment.student:
                students_list.append({
                    'id': enrollment.student.id,
                    'username': enrollment.student.username,
                    'email': enrollment.student.email,
                    'university_id': enrollment.student.university_id
                })

    # 3. Return everything
    return jsonify({
        'course': {
            'id': course.id,
            'name': course.name,
            'description': course.description,
            'class_code': course.class_code,
            'teacher_id': course.teacher_id,
            'semester_id': course.semester_id,
            'is_attendance_locked': course.is_attendance_locked
        },
        'students': students_list # <--- This is what the Attendance Sheet needs!
    }), 200

# --- GET SINGLE COURSE DETAILS ---
# --- DEBUG VERSION OF GET_COURSE ---
@content_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    try:
        identity = get_jwt_identity()
        current_user_id = identity['id'] if isinstance(identity, dict) else int(identity)
        
        course = Course.query.get(course_id)
        if not course: 
            return jsonify({'error': 'Course not found'}), 404

        is_teacher = (current_user_id == course.teacher_id)

        students_list = []
        if is_teacher:
            for enrollment in course.enrollments:
                s = enrollment.student
                students_list.append({'id': s.id, 'username': s.username})

        materials = [{'id': m.id, 'title': m.title, 'file_path': m.file_path, 'is_processed': m.is_processed} for m in course.materials]
        assignments = [{'id': a.id, 'title': a.title, 'description': a.description} for a in course.assignments]

        quizzes_query = Quiz.query.filter_by(course_id=course_id).all()
        quiz_list = [{
            'id': q.id,
            'title': q.title,
            'time_limit': q.time_limit_minutes
        } for q in quizzes_query]
        
        return jsonify({
            'course': {
                'id': course.id,
                'name': course.name,
                'class_code': course.class_code,
                'description': course.description,
                'is_attendance_locked': course.is_attendance_locked
            },
            'is_teacher': is_teacher,
            'students': students_list,
            'materials': materials,
            'assignments': assignments,
            'quizzes': quiz_list
        }), 200

    except Exception as e:
        print(f"SERVER ERROR in get_course: {e}")
        return jsonify({'error': str(e)}), 500

# --- MARK ATTENDANCE (Teacher) ---
@content_bp.route('/attendance/mark', methods=['POST'])
@jwt_required()
def mark_attendance():
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity context'}), 401
        
    user = User.query.get(user_id)
    if not user or user.role != 'teacher': 
        return jsonify({'error': 'Unauthorized. Teacher privileges required.'}), 403
    
    data = request.get_json()
    course_id = data.get('course_id')
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    if course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You are not the assigned instructor for this course.'}), 403
        
    if course.is_attendance_locked:
        return jsonify({'error': 'Attendance is locked. You cannot edit it.'}), 403

    date_str = data.get('date')
    session_num = data.get('session_number')
    records = data.get('records')

    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        for rec in records:
            existing = Attendance.query.filter_by(
                course_id=course_id, 
                student_id=rec['student_id'], 
                date=date_obj
            ).first()
            
            if existing:
                existing.status = rec['status']
            else:
                new_att = Attendance(
                    course_id=course_id,
                    student_id=rec['student_id'],
                    date=date_obj,
                    status=rec['status'],
                    session_number=session_num
                )
                db.session.add(new_att)
        
        db.session.commit()
        return jsonify({'message': 'Attendance saved successfully!'}), 201

    except Exception as e:
        print(f"Attendance Error: {e}")
        return jsonify({'error': 'Failed to save'}), 500

# --- GET ATTENDANCE SHEET (Teacher View) ---
# --- GET ATTENDANCE SHEET (Teacher View) ---
@content_bp.route('/attendance/<int:course_id>', methods=['GET'])
@jwt_required()
def get_attendance_sheet(course_id):
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity context'}), 401

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course context not found'}), 404

    # 🔥 SECURITY FIX: Direct access boundary isolation.
    # Assures only the course's teacher can extract or view the total class sheet.
    if course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. Privileged informational scope.'}), 403

    records = Attendance.query.filter_by(course_id=course_id).all()
    output = []
    for r in records:
        output.append({
            'student_id': r.student_id,
            'date': r.date.isoformat() if r.date else None,
            'status': r.status,
            'session': r.session_number
        })
    return jsonify({'records': output}), 200

# --- LOCK ATTENDANCE (With Debug Prints) ---
@content_bp.route('/attendance/lock', methods=['POST'])
@jwt_required()
def lock_attendance():
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    data = request.get_json()
    course_id = data.get('course_id')
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404
        
    if course.teacher_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    course.is_attendance_locked = True
    db.session.commit()
    return jsonify({'message': 'Attendance finalized and locked successfully'}), 200

@content_bp.route('/assignment', methods=['POST'])
@jwt_required()
def create_assignment():
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    user = db.session.get(User, user_id)
    
    if not user or user.role != 'teacher':
        return jsonify({'error': 'Only teachers can create assignments'}), 403

    # 1. Handle Question File (Visible to Students)
    file = request.files.get('file')
    file_path = None
    
    if file:
        filename = secure_filename(file.filename)
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'assignments')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

    # 2. Handle Solution File OR Text (Hidden for AI)
    solution_file = request.files.get('solution_file')
    teacher_solution_text = request.form.get('teacher_solution', '')

    if solution_file:
        # Save temp file to extract text
        sol_filename = secure_filename(f"SOLUTION_{solution_file.filename}")
        sol_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'solutions')
        os.makedirs(sol_path, exist_ok=True)
        full_sol_path = os.path.join(sol_path, sol_filename)
        solution_file.save(full_sol_path)
        
        # ✅ Automatically extract text from the PDF/DOCX
        extracted_text = extract_text_from_file(full_sol_path)
        if extracted_text:
            teacher_solution_text = extracted_text

    # Validation: We need at least some solution text for the AI to work
    if not teacher_solution_text.strip():
        return jsonify({'error': 'A Solution File or Text is required for AI grading'}), 400

    course_id = request.form.get('course_id')
    title = request.form.get('title')
    description = request.form.get('description', '')
    deadline_str = request.form.get('deadline')
    
    deadline = None
    if deadline_str:
        try:
            deadline = datetime.fromisoformat(deadline_str)
        except ValueError:
            pass

    assignment = Assignment(
        course_id=course_id,
        title=title,
        description=description,
        file_path=file_path,
        deadline=deadline,
        teacher_solution=teacher_solution_text # ✅ Save the extracted text
    )
    
    db.session.add(assignment)
    db.session.commit()

    # Notify Students
    course = db.session.get(Course, course_id)
    if course:
        for enrollment in course.enrollments:
            notif = Notification(
                user_id=enrollment.student_id,
                message=f"New Assignment posted in {course.name}: {assignment.title}"
            )
            db.session.add(notif)
        db.session.commit()
    
    return jsonify({'message': 'Assignment created successfully', 'id': assignment.id}), 201
    
# 1. MAKE SURE Course and Notification ARE IMPORTED AT THE TOP
from app.models.models import db, User, Material, GeneratedContent, Assignment, Submission, Notification, Course

# ... (other routes) ...

@content_bp.route('/assignment/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_assignment(assignment_id):
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity token'}), 401

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
        
    course = Course.query.get(assignment.course_id)
    if not course:
        return jsonify({'error': 'Associated course context missing'}), 404
        
    # 🔥 SECURITY FIX: Enforce section ownership verification before data deletion
    if course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You cannot delete tasks assigned by other instructors.'}), 403
    
    try:
        target_message = f"New Assignment posted in {course.name}: {assignment.title}"
        Notification.query.filter_by(message=target_message).delete()
    except Exception as e:
        print(f"Error cleaning up notifications: {e}")

    if assignment.file_path and os.path.exists(assignment.file_path):
        try: 
            os.remove(assignment.file_path)
        except Exception: 
            pass

    db.session.delete(assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment deleted successfully'}), 200

# 1. UPDATE THIS FUNCTION (To check if student has submitted)
@content_bp.route('/assignments/<int:course_id>', methods=['GET'])
@jwt_required()
def get_assignments(course_id):
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    assignments = Assignment.query.filter_by(course_id=course_id).all()
    
    results = []
    for a in assignments:
        data = {
            'id': a.id,
            'title': a.title,
            'description': a.description,
            'deadline': a.deadline.isoformat() if a.deadline else None,
            'created_at': a.created_at.isoformat(),
            'file_path': a.file_path,
            'my_submission': None,
            'my_submission_grade': None # Add grade info
        }
        
        sub = Submission.query.filter_by(assignment_id=a.id, student_id=user_id).first()
        if sub:
            data['my_submission'] = {
                'id': sub.id,
                'submitted_at': sub.submitted_at.isoformat(),
                'file_path': sub.file_path
            }
            data['my_submission_grade'] = sub.grade if sub.grade != 'N/A' else 'Pending'
            
        results.append(data)

    return jsonify({'assignments': results}), 200

# 2. ADD THIS NEW FUNCTION (To remove a submission)
@content_bp.route('/submission/delete/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
def delete_my_submission(assignment_id):
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    
    submission = Submission.query.filter_by(assignment_id=assignment_id, student_id=user_id).first()
    
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
        
    if submission.file_path and os.path.exists(submission.file_path):
        try: os.remove(submission.file_path)
        except: pass
            
    db.session.delete(submission)
    db.session.commit()
    return jsonify({'message': 'Submission removed successfully'}), 200

@content_bp.route('/assignment/<int:assignment_id>', methods=['GET'])
@jwt_required()
def get_assignment_detail(assignment_id):
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)

    assignment = Assignment.query.get(assignment_id)
    
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404

    # ✅ FIX: Also return the current student's submission so the frontend
    # can show "Graded" instead of "Under Review" after teacher publishes.
    my_submission = Submission.query.filter_by(
        assignment_id=assignment_id,
        student_id=user_id
    ).first()

    my_submission_data = None
    if my_submission:
        my_submission_data = {
            'id': my_submission.id,
            'grade': my_submission.grade,
            'marks': my_submission.obtained_marks,
            'ai_score': my_submission.ai_score,
            'plagiarism_score': my_submission.plagiarism_score,
            'feedback': my_submission.feedback,
            'is_published': my_submission.is_published,
        }
    
    return jsonify({
        'id': assignment.id,
        'title': assignment.title,
        'description': assignment.description,
        'deadline': assignment.deadline.isoformat() if assignment.deadline else None,
        'created_at': assignment.created_at.isoformat(),
        'my_submission': my_submission_data   # ✅ Now included
    }), 200

# 3. UPDATE THIS FUNCTION (To prevent double upload)
@content_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_assignment():
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    
    assignment_id = request.form.get('assignment_id')
    
    existing = Submission.query.filter_by(assignment_id=assignment_id, student_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already submitted.'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    filename = secure_filename(f"sub_{user_id}_{file.filename}")
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'submissions')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    submission = Submission(
        assignment_id=assignment_id,
        student_id=user_id,
        file_path=file_path,
        status='submitted'
    )
    
    db.session.add(submission)
    db.session.commit()
    return jsonify({'message': 'Assignment submitted successfully'}), 201

@content_bp.route('/submission/<int:submission_id>', methods=['GET'])
@jwt_required()
def get_submission_detail(submission_id):
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    return jsonify({
        'id': submission.id,
        'student_name': submission.student.username,
        'submitted_at': submission.submitted_at.isoformat(),
        'status': submission.status
    }), 200

@content_bp.route('/generated/<int:material_id>', methods=['GET'])
@jwt_required()
def get_generated_content(material_id):
    contents = GeneratedContent.query.filter_by(material_id=material_id).all()
    return jsonify({
        'contents': [{
            'id': c.id,
            'content_type': c.content_type,
            'created_at': c.created_at.isoformat(),
            'preview': c.content[:200] + '...'
        } for c in contents]
    }), 200

@content_bp.route('/generated/detail/<int:content_id>', methods=['GET'])
@jwt_required()
def get_content_detail(content_id):
    content = GeneratedContent.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404
    
    return jsonify({
        'id': content.id,
        'content_type': content.content_type,
        'content': content.content,
        'created_at': content.created_at.isoformat()
    }), 200

@content_bp.route('/download/<int:content_id>', methods=['GET'])
@jwt_required()
def download_content(content_id):
    try:
        file_format = request.args.get('format', 'docx').lower()
        solutions_param = request.args.get('solutions', 'true').lower()
        include_solutions = solutions_param == 'true'

        content_record = GeneratedContent.query.get_or_404(content_id)
        material = Material.query.get(content_record.material_id)
        course = Course.query.get(material.course_id)
        teacher = User.query.get(course.teacher_id)
        teacher_name = teacher.username if teacher else "Unknown Instructor"

        docx_stream = ExportService.create_university_doc(
            content_text=content_record.content,
            course_name=course.name,
            course_code=course.course_catalog_code if hasattr(course, 'course_catalog_code') else course.class_code,
            teacher_name=teacher_name,
            doc_type=content_record.content_type,
            program_name=course.program if hasattr(course, 'program') else "BS-CS",
            include_answers=include_solutions 
        )
        
        date_str = datetime.now().strftime('%Y%m%d')
        clean_type = content_record.content_type.replace(" ", "_")
        suffix = "_SolutionKey" if include_solutions else "_StudentCopy"
        base_filename = f"{course.class_code}_{clean_type}_{date_str}{suffix}"

        if file_format == 'pdf':
            pdf_stream = ExportService.docx_stream_to_pdf(docx_stream)
            if not pdf_stream:
                return jsonify({'error': 'PDF conversion failed.'}), 500
            return send_file(pdf_stream, as_attachment=True, download_name=f"{base_filename}.pdf", mimetype='application/pdf')
        
        return send_file(docx_stream, as_attachment=True, download_name=f"{base_filename}.docx", mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    except Exception as e:
        print(f"Download Error: {e}")
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

@content_bp.route('/download-file', methods=['GET'])
@jwt_required()
def download_file():
    file_path = request.args.get('path')
    if not file_path: 
        return jsonify({'error': 'No path provided'}), 400
        
    # 🔥 SECURITY FIX: Mitigates Path Traversal (Arbitrary Local File Read Flaws)
    # Validates that the requested target resides strictly within the safe upload directory boundary
    base_upload_dir = os.path.abspath(current_app.config['UPLOAD_FOLDER'])
    abs_path = os.path.abspath(file_path)
    
    if not abs_path.startswith(base_upload_dir):
        return jsonify({'error': 'Access denied. Security parameter tracking restriction violation.'}), 403
        
    if not os.path.exists(abs_path) or os.path.isdir(abs_path): 
        return jsonify({'error': 'File not found'}), 404
        
    return send_file(abs_path, as_attachment=True)

# This is the single correct route for submissions to avoid conflicts
@content_bp.route('/submissions/<int:assignment_id>', methods=['GET'])
@jwt_required()
def get_assignment_submissions(assignment_id):
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity token'}), 401

    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get(assignment.course_id)
    
    # 🔥 SECURITY FIX: Direct access boundary enforcement on student artifacts
    if not course or course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You are not the assigned instructor for this course section.'}), 403

    submissions = Submission.query.filter_by(assignment_id=assignment_id).all()
    
    return jsonify({
        'submissions': [{
            'id': s.id,
            'student_name': s.student.username if s.student else 'Unknown',
            'email': s.student.email if s.student else 'N/A',
            'submitted_at': s.submitted_at.strftime('%Y-%m-%d %H:%M') if s.submitted_at else 'N/A',
            'file_path': s.file_path,
            'grade': s.grade,
            'marks': s.obtained_marks,
            'ai_score': s.ai_score,
            'plagiarism_score': s.plagiarism_score,
            'feedback': s.feedback,
            'is_published': s.is_published
        } for s in submissions]
    }), 200
    
# --- TEACHER ANALYTICS (Assignments + Attendance) ---
@content_bp.route('/analytics/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_analytics(course_id):
    try:
        # 1. Verify Teacher Identity Context securely
        user_id = int(get_jwt_identity())
        course = Course.query.get(course_id)
        if not course: 
            return jsonify({'error': 'Course not found'}), 404
        
        if course.teacher_id != user_id:
            return jsonify({'error': 'Access denied. You are not the authorized instructor for this section.'}), 403
        
        # 2. Basic Counts
        total_students = len(course.enrollments)
        
        # --- ATTENDANCE STATS ---
        attendance_records = Attendance.query.filter_by(course_id=course_id).all()
        total_sessions = db.session.query(Attendance.session_number).filter_by(course_id=course_id).distinct().count()
        
        # Calculate "At Risk" students (< 75% attendance)
        student_attendance = {} # { student_id: present_count }
        
        for r in attendance_records:
            if r.student_id not in student_attendance: student_attendance[r.student_id] = 0
            if r.status == 'Present':
                student_attendance[r.student_id] += 1
                
        at_risk_students = []
        for enrollment in course.enrollments:
            sid = enrollment.student_id
            s_name = enrollment.student.username
            p_count = student_attendance.get(sid, 0)
            
            percentage = 0
            if total_sessions > 0:
                percentage = (p_count / total_sessions) * 100
                
            if percentage < 75:
                at_risk_students.append({
                    'name': s_name,
                    'percentage': round(percentage, 1),
                    'missed': total_sessions - p_count
                })

        # --- ASSIGNMENT STATS ---
        assignments = Assignment.query.filter_by(course_id=course_id).all()
        total_assignments = len(assignments)
        
        assignment_data = []
        total_submissions = 0
        
        for a in assignments:
            sub_count = Submission.query.filter_by(assignment_id=a.id).count()
            total_submissions += sub_count
            assignment_data.append({
                'name': a.title[:15], 
                'submitted': sub_count,
                'pending': max(0, total_students - sub_count)
            })

        return jsonify({
            'kpi': {
                'students': total_students,
                'sessions_held': total_sessions,
                'avg_attendance': 'N/A', # You could calculate class average here
                'at_risk_count': len(at_risk_students)
            },
            'at_risk_list': at_risk_students, # List of students < 75%
            'assignment_charts': assignment_data
        }), 200
        
    except Exception as e:
        print(f"ANALYTICS ERROR: {e}")
        return jsonify({'error': str(e)}), 500

# --- STUDENT ANALYTICS ---
@content_bp.route('/analytics/student/me', methods=['GET'])
@jwt_required()
def get_student_analytics():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'student':
            return jsonify({'error': 'Unauthorized'}), 403

        # FIX: Access courses via enrollments
        enrolled_courses = []
        for enrollment in user.enrollments:
            if enrollment.course:
                enrolled_courses.append(enrollment.course)
        
        total_courses = len(enrolled_courses)
        total_assignments = 0
        total_submissions = 0
        course_performance = []

        for course in enrolled_courses:
            course_assignments = Assignment.query.filter_by(course_id=course.id).all()
            a_count = len(course_assignments)
            a_ids = [a.id for a in course_assignments]
            
            if a_ids:
                s_count = Submission.query.filter(
                    Submission.student_id == user_id,
                    Submission.assignment_id.in_(a_ids)
                ).count()
            else:
                s_count = 0
            
            total_assignments += a_count
            total_submissions += s_count
            
            pending = max(0, a_count - s_count)

            course_performance.append({
                'name': course.name,
                'completed': s_count,
                'pending': pending
            })

        pending_tasks = max(0, total_assignments - total_submissions)

        return jsonify({
            'kpi': {
                'courses': total_courses,
                'assignments': total_assignments,
                'completed': total_submissions,
                'pending': pending_tasks
            },
            'charts': course_performance
        }), 200

    except Exception as e:
        print(f"STUDENT ANALYTICS ERROR: {e}")
        return jsonify({'error': str(e)}), 500
    
# --- 1. SCHEDULE LIVE CLASS (Updated to support Zoom/Meet) ---
@content_bp.route('/live/schedule', methods=['POST'])
@jwt_required()
def schedule_class():
    # Fix: Handle identity safely (string vs int issue)
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    
    user = User.query.get(user_id)
    if user.role != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    course_id = data.get('course_id')
    title = data.get('title')
    start_str = data.get('start_time')
    description = data.get('description', '')
    
    # Check if teacher provided a link (Zoom/Meet), otherwise generate Jitsi
    provided_link = data.get('meeting_link')

    try:
        # Verify Course Ownership
        course = Course.query.get(course_id)
        if not course or course.teacher_id != user_id:
            return jsonify({'error': 'You can only schedule for your own courses'}), 403

        # Use provided link OR generate one
        if provided_link and provided_link.strip():
            meeting_link = provided_link
        else:
            unique_id = str(uuid.uuid4())[:8]
            meeting_link = f"https://meet.jit.si/SmartTutor_{course_id}_{unique_id}"
        
        # Parse date
        if 'T' in start_str:
            start_time = datetime.strptime(start_str, '%Y-%m-%dT%H:%M')
        else:
            start_time = datetime.strptime(start_str, '%Y-%m-%d %H:%M')

        # Save to DB
        new_session = LiveSession(
            course_id=course_id,
            title=title,
            description=description,
            start_time=start_time,
            meeting_link=meeting_link
        )
        db.session.add(new_session)
        
        # Notify Students
        enrolled_students = [e.student for e in course.enrollments]
        count = 0
        for student in enrolled_students:
            msg = f"🔴 Live Class: '{title}' in {course.name} at {start_time.strftime('%I:%M %p')}"
            new_notif = Notification(user_id=student.id, message=msg, is_read=False)
            db.session.add(new_notif)
            count += 1
        
        db.session.commit()
        return jsonify({'message': f'Scheduled & Notified {count} students', 'link': meeting_link}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# --- 2. GET SESSIONS FOR A SPECIFIC COURSE (New Route) ---
@content_bp.route('/live/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_sessions(course_id):
    # This route is needed for CourseDetail.jsx
    sessions = LiveSession.query.filter_by(course_id=course_id).order_by(LiveSession.start_time.asc()).all()
    
    return jsonify({'sessions': [{
        'id': s.id,
        'title': s.title,
        'description': s.description,
        'link': s.meeting_link,
        'start_time': s.start_time.strftime('%Y-%m-%d %I:%M %p')
    } for s in sessions]}), 200

# --- 3. DELETE SESSION (Keep your existing one) ---
@content_bp.route('/live-sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_live_session(session_id):
    try:
        try:
            identity = get_jwt_identity()
            user_id = identity['id'] if isinstance(identity, dict) else int(identity)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid identity context'}), 401

        session = LiveSession.query.get_or_404(session_id)
        course = Course.query.get(session.course_id)
        
        if not course or course.teacher_id != user_id:
            return jsonify({'error': 'Access denied. You do not manage this session context.'}), 403

        db.session.delete(session)
        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to drop live session record parameters.'}), 500

# --- STUDENT ATTENDANCE STATS ---
@content_bp.route('/attendance/student/me', methods=['GET'])
@jwt_required()
def get_my_attendance_stats():
    # 1. Verify Student
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or user.role != 'student':
        return jsonify({'error': 'Unauthorized'}), 403

    stats = []
    
    # 2. Loop through enrolled courses
    # (Assumes user.enrollments links to courses)
    for enrollment in user.enrollments:
        course = enrollment.course
        if not course: continue
        
        # 3. Get all attendance records for THIS student in THIS course
        my_records = Attendance.query.filter_by(
            course_id=course.id, 
            student_id=user_id
        ).all()
        
        # 4. Calculate Stats
        total_sessions = len(my_records)
        present_count = sum(1 for r in my_records if r.status == 'Present')
        absent_count = sum(1 for r in my_records if r.status == 'Absent')
        late_count = sum(1 for r in my_records if r.status == 'Late')
        
        # Calculate Percentage (Avoid division by zero)
        percentage = 0
        if total_sessions > 0:
            percentage = round((present_count / total_sessions) * 100, 1)
            
        stats.append({
            'course_id': course.id,
            'course_name': course.name,
            'class_code': course.class_code,
            'total_sessions': total_sessions,
            'present': present_count,
            'absent': absent_count,
            'late': late_count,
            'percentage': percentage
        })
        
    return jsonify({'stats': stats}), 200

# --- GET QUIZZES FOR A COURSE (With Attempt Status) ---
# --- GET QUIZZES FOR A COURSE (With Attempt Status & Assignment logic) ---
@content_bp.route('/quizzes/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_quizzes(course_id):
    try:
        from app.models.models import Quiz, QuizSubmission, User
        
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # 1. Logic: Teachers see ALL quizzes. Students only see PUBLISHED quizzes.
        if user.role == 'teacher':
            quizzes = Quiz.query.filter_by(course_id=course_id).all()
        else:
            quizzes = Quiz.query.filter_by(course_id=course_id, is_published=True).all()
        
        output = []
        for q in quizzes:
            # Check if THIS student has submitted THIS quiz
            submission = QuizSubmission.query.filter_by(
                quiz_id=q.id, 
                student_id=user_id
            ).first()

            output.append({
                'id': q.id,
                'title': q.title,
                'time_limit': q.time_limit_minutes,
                'is_published': q.is_published, # Needed for Teacher Badge
                'deadline': q.deadline.isoformat() if q.deadline else None, # Needed for Countdown
                'attempted': bool(submission),
                'score': submission.score if submission else None
            })
        
        return jsonify({'quizzes': output}), 200
    except Exception as e:
        print(f"ERROR Fetching Quizzes: {e}")
        return jsonify({'error': str(e)}), 500
    
# --- DELETE COURSE (Teacher Only - Deep Delete) ---
@content_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@jwt_required()
def delete_course_teacher(course_id):
    current_user_id = int(get_jwt_identity())
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    # Security Check: Ensure the logged-in teacher OWNS this course
    if course.teacher_id != current_user_id:
        return jsonify({'error': 'Unauthorized: You can only delete your own courses'}), 403

    try:
        # ✅ FIX: Delete Live Sessions FIRST to prevent IntegrityError
        LiveSession.query.filter_by(course_id=course.id).delete()

        # 1. Delete Attendance
        Attendance.query.filter_by(course_id=course.id).delete()

        # 2. Delete Quiz Submissions & Quizzes
        quizzes = Quiz.query.filter_by(course_id=course.id).all()
        for q in quizzes:
            # Delete all student submissions for this quiz first
            QuizSubmission.query.filter_by(quiz_id=q.id).delete()
            # Then delete the quiz
            db.session.delete(q)

        # 3. Delete Assignment Submissions & Assignments
        for assignment in course.assignments:
            Submission.query.filter_by(assignment_id=assignment.id).delete()
            db.session.delete(assignment)

        # 4. Delete Materials
        for material in course.materials:
            # Optional: Delete actual file from disk here if needed
            db.session.delete(material)

        # 5. Clear Enrollments
        course.enrollments = []

        # 6. Finally, Delete Course
        db.session.delete(course)
        db.session.commit()
        
        return jsonify({'message': 'Course and all related data deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ TEACHER DELETE ERROR: {e}")
        return jsonify({'error': 'Failed to delete course'}), 500
    
@content_bp.route('/generated/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_generated_content(course_id):
    # Join GeneratedContent with Material to filter by Course ID
    results = db.session.query(GeneratedContent, Material)\
        .join(Material, GeneratedContent.material_id == Material.id)\
        .filter(Material.course_id == course_id)\
        .order_by(GeneratedContent.created_at.desc())\
        .all()

    data = []
    for content, material in results:
        data.append({
            'id': content.id,
            'type': content.content_type, # e.g., 'quiz', 'summary'
            'created_at': content.created_at.strftime('%Y-%m-%d %H:%M'),
            'material_title': material.title,
            'file_path': content.file_path
        })

    return jsonify({'generated_content': data}), 200

# REPLACE YOUR OLD delete_generated_content FUNCTION WITH THIS ONE
@content_bp.route('/generated/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_generated_content(content_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    # Security: Ensure only teachers can delete
    if user.role != 'teacher':
        return jsonify({'error': 'Only teachers can delete content'}), 403
    
    content = GeneratedContent.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404
    
    try:
        # 1. Remove the physical file if it exists
        if content.file_path and os.path.exists(content.file_path):
            os.remove(content.file_path)
            
        # 2. Remove from database
        db.session.delete(content)
        db.session.commit()
        
        return jsonify({'message': 'Resource deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
# --- GET MATERIALS (Fixes Student Download Issue) ---
@content_bp.route('/materials/<int:course_id>', methods=['GET'])
@jwt_required()
def get_materials(course_id):
    # 1. Fetch the Course object directly (Returns 404 if invalid ID)
    course = Course.query.get_or_404(course_id)
    
    # 2. Fetch materials for this course
    materials = Material.query.filter_by(course_id=course_id).all()
    
    # 3. Return response using the COURSE object for details
    return jsonify({
        'course_name': course.name, # ✅ Works even if materials list is empty
        'student_count': len(course.enrollments), # ✅ Uses course relationship directly
        'materials': [{
            'id': m.id, 
            'title': m.title, 
            'is_processed': m.is_processed, 
            'file_path': m.file_path
        } for m in materials]
    }), 200

# --- ADD THIS MISSING FUNCTION TO content.py ---

@content_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_material():
    try:
        if 'file' not in request.files: return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        title = request.form.get('title')
        course_id = request.form.get('course_id')
        
        if not file or not title or not course_id: return jsonify({'error': 'Missing data'}), 400

        filename = secure_filename(file.filename)
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        new_material = Material(
            title=title, 
            file_path=file_path, 
            course_id=course_id,
            file_type='pdf', 
            is_processed=False
        )
        db.session.add(new_material)
        db.session.commit()
        
        try:
            rag_service = RAGService()
            rag_service.process_document(file_path, new_material.id)
            new_material.is_processed = True
            db.session.commit()
            return jsonify({'message': 'File uploaded successfully'}), 201
        except Exception as e:
            db.session.delete(new_material)
            db.session.commit()
            return jsonify({'error': f'AI Processing Error: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': f'Server Error: {str(e)}'}), 500

# --- ADD THIS TO backend/app/routes/content.py ---

@content_bp.route('/materials/<int:material_id>', methods=['DELETE'])
@jwt_required()
def delete_material(material_id):
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    user = User.query.get(user_id)
    if user.role != 'teacher': return jsonify({'error': 'Unauthorized'}), 403

    material = Material.query.get(material_id)
    if not material: return jsonify({'error': 'Material not found'}), 404
    
    if material.file_path and os.path.exists(material.file_path):
        try: os.remove(material.file_path)
        except: pass
            
    db.session.delete(material)
    db.session.commit()
    return jsonify({'message': 'Material deleted'}), 200

# --- 4. GET ALL SESSIONS FOR USER (For Dashboard) ---
@content_bp.route('/live/all_sessions', methods=['GET'])
@jwt_required()
def get_all_user_sessions():
    # Handle identity safely
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    
    user = User.query.get(user_id)
    sessions_data = []

    # Get courses the user teaches OR is enrolled in
    if user.role == 'teacher':
        courses = user.courses_taught
    else:
        courses = [e.course for e in user.enrollments if e.course]

    for course in courses:
        # Get future sessions
        sessions = LiveSession.query.filter_by(course_id=course.id).order_by(LiveSession.start_time).all()
        for s in sessions:
            sessions_data.append({
                'id': s.id,
                'course_name': course.name,
                'title': s.title,
                'start_time': s.start_time.strftime('%Y-%m-%d %H:%M'),
                'meeting_link': s.meeting_link
            })

    return jsonify({'sessions': sessions_data}), 200

# ... (Keep existing code) ...

# --- GET STUDENT GRADES (Assignments + Quizzes) ---
@content_bp.route('/grades/<int:course_id>/me', methods=['GET'])
@jwt_required()
def get_my_course_grades(course_id):
    identity = get_jwt_identity()
    user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    
    # 1. Fetch Quiz Scores
    quizzes = Quiz.query.filter_by(course_id=course_id).all()
    grade_list = []
    
    for q in quizzes:
        sub = QuizSubmission.query.filter_by(quiz_id=q.id, student_id=user_id).first()
        grade_list.append({
            'id': q.id,
            'title': q.title,
            'type': 'Quiz',
            'date': sub.submitted_at.strftime('%Y-%m-%d') if sub else '-',
            'score': sub.score if sub else None, # e.g. 85.0
            'status': 'Graded' if sub else 'Pending'
        })

    # 2. Fetch Assignment Status
    assignments = Assignment.query.filter_by(course_id=course_id).all()
    
    for a in assignments:
        sub = Submission.query.filter_by(assignment_id=a.id, student_id=user_id).first()
        
        if not sub:
            status = 'Missing'
            score = None
            grade = None
        elif sub.is_published:
            # ✅ Grade is published — show the real marks and grade
            status = 'Graded'
            score = sub.obtained_marks
            grade = sub.grade
        else:
            # Submitted but teacher hasn't published yet
            status = 'Under Review'
            score = None
            grade = None

        grade_list.append({
            'id': a.id,
            'title': a.title,
            'type': 'Assignment',
            'date': sub.submitted_at.strftime('%Y-%m-%d') if sub else '-',
            'score': score,
            'grade': grade,
            'status': status
        })

    return jsonify({'grades': grade_list}), 200

# --- ATTENDANCE REPORT (Charts & Trends) ---
@content_bp.route('/attendance/report/<int:course_id>', methods=['GET'])
@jwt_required()
def get_attendance_report(course_id):
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid token signature structure'}), 401
    
    course = Course.query.get_or_404(course_id)
    
    if course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. Privileged class analytics view.'}), 403
    
    records = Attendance.query.filter_by(course_id=course_id).all()
    
    if not records:
        return jsonify({'message': 'No records found', 'trend': [], 'pie': []}), 200

    # 2. PIE CHART DATA (Total Counts)
    status_counts = {'Present': 0, 'Absent': 0, 'Late': 0}
    for r in records:
        if r.status in status_counts:
            status_counts[r.status] += 1
            
    pie_data = [
        {'name': 'Present', 'value': status_counts['Present']},
        {'name': 'Absent', 'value': status_counts['Absent']},
        {'name': 'Late', 'value': status_counts['Late']}
    ]

    # 3. TREND LINE DATA (Group by Session)
    # Structure: { 1: {'total': 10, 'present': 8}, 2: ... }
    sessions_map = {}
    
    for r in records:
        s_num = r.session_number
        if s_num not in sessions_map:
            sessions_map[s_num] = {'present': 0, 'total': 0}
        
        sessions_map[s_num]['total'] += 1
        if r.status == 'Present':
            sessions_map[s_num]['present'] += 1
            
    # Convert to sorted list for Chart
    trend_data = []
    for s_num in sorted(sessions_map.keys()):
        data = sessions_map[s_num]
        percentage = round((data['present'] / data['total']) * 100, 1)
        trend_data.append({
            'session': f"S{s_num}", # Label like "S1", "S2"
            'percentage': percentage
        })

    # 4. AT RISK STUDENTS (Same logic as analytics)
    student_stats = {}
    total_sessions = len(sessions_map)
    
    for r in records:
        if r.student_id not in student_stats: student_stats[r.student_id] = 0
        if r.status == 'Present': student_stats[r.student_id] += 1
        
    at_risk = []
    for enrollment in course.enrollments:
        sid = enrollment.student_id
        present = student_stats.get(sid, 0)
        pct = (present / total_sessions * 100) if total_sessions > 0 else 0
        
        if pct < 75:
            at_risk.append({
                'name': enrollment.student.username,
                'percentage': round(pct, 1),
                'missed': total_sessions - present
            })

    return jsonify({
        'pie': pie_data,
        'trend': trend_data,
        'at_risk': at_risk
    }), 200

# --- SEMESTER DASHBOARD ROUTES ---

# 1. Get Courses for a Teacher in a Specific Semester
@content_bp.route('/teacher/courses/<int:semester_id>', methods=['GET'])
@jwt_required()
def get_teacher_semester_courses(semester_id):
    user_id = int(get_jwt_identity())
    courses = Course.query.filter_by(teacher_id=user_id, semester_id=semester_id).all()
    
    return jsonify({
        'courses': [{
            'id': c.id,
            'name': c.name,
            'code': c.class_code,
            'description': c.description,
            'student_count': len(c.enrollments)
        } for c in courses]
    }), 200

# 2. Get Courses for a Student in a Specific Semester (Enrolled)
@content_bp.route('/student/courses/<int:semester_id>', methods=['GET'])
@jwt_required()
def get_student_semester_courses(semester_id):
    user_id = int(get_jwt_identity())
    
    # Join Enrollment -> Course -> Filter by Semester & Student
    enrollments = db.session.query(Enrollment).join(Course).filter(
        Enrollment.student_id == user_id,
        Course.semester_id == semester_id
    ).all()
    
    return jsonify({
        'courses': [{
            'id': e.course.id,
            'name': e.course.name,
            'code': e.course.class_code,
            'teacher': e.course.teacher.username
        } for e in enrollments]
    }), 200

# 3. Get ALL available courses in a semester (For Student Enrollment)
@content_bp.route('/semester/<int:semester_id>/available', methods=['GET'])
@jwt_required()
def get_all_semester_courses(semester_id):
    courses = Course.query.filter_by(semester_id=semester_id).all()
    return jsonify({
        'courses': [{
            'id': c.id,
            'name': c.name,
            'teacher': c.teacher.username,
            'code': c.class_code
        } for c in courses]
    }), 200

# ✅ NEW: SUBMIT & GRADE WITH AI
@content_bp.route('/assignment/submit-and-grade', methods=['POST'])
@jwt_required()
def submit_and_grade():
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
        
        # 1. Get Data from Form
        assignment_id = request.form.get('assignment_id')
        student_text = request.form.get('answer_text') 
        file = request.files.get('file')

        if not file:
            return jsonify({'error': 'No file uploaded'}), 400

        # 2. Save Student File
        filename = secure_filename(f"sub_{user_id}_{file.filename}")
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'submissions')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)

        # 3. Extract Text from Student File (Handles Scanned PDFs & OCR automatically)
        extracted_text = extract_text_from_file(file_path)
        
        if extracted_text and len(extracted_text) > 10:
            student_text = extracted_text
        else:
            return jsonify({'error': 'File is empty or unreadable. If this is a scanned document, ensure Tesseract OCR is installed on the server.'}), 400

        # 4. Get Teacher Solution
        assignment = db.session.get(Assignment, assignment_id)
        if not assignment:
             return jsonify({'error': 'Assignment not found'}), 404

        teacher_solution_text = assignment.teacher_solution 
        
        # ✅ FIX: If Teacher Solution is a FILE PATH, extract the text from it
        if teacher_solution_text and (teacher_solution_text.endswith('.pdf') or teacher_solution_text.endswith('.docx')):
            # Check if file exists on server
            if os.path.exists(teacher_solution_text):
                extracted_sol = extract_text_from_file(teacher_solution_text)
                if len(extracted_sol) > 10:
                    teacher_solution_text = extracted_sol
            else:
                # Fallback: If file is missing, we can't grade accurately
                print(f"⚠️ Warning: Solution file not found at {teacher_solution_text}")

        if not teacher_solution_text:
            return jsonify({'error': 'Teacher has not provided a valid solution key.'}), 400

        # 5. Get Peers for Plagiarism
        other_subs = Submission.query.filter(
            Submission.assignment_id == assignment_id, 
            Submission.student_id != user_id
        ).all()
        other_texts = [sub.answer_text for sub in other_subs if sub.answer_text]

        # 6. Run AI Assessment
        result = AssessmentService.assess_submission(
            student_text=student_text, 
            teacher_solution=teacher_solution_text, # Passed extracted text, not path
            other_student_texts=other_texts
        )

        # 7. Save Submission
        new_sub = Submission(
            student_id=user_id,
            assignment_id=assignment_id,
            file_path=file_path,       
            answer_text=student_text,  
            
            # Grading Results (Hidden from student initially)
            obtained_marks=result['marks'],
            grade=result['grade'],
            feedback=" | ".join(result['feedback']),
            ai_score=result['ai_score'],
            plagiarism_score=result['plagiarism_score'],
            similarity_score=result['accuracy_score'],
            
            status='graded',
            is_published=False  # ✅ Keeps results hidden until teacher clicks "Publish"
        )
        
        # Remove old submission if exists
        Submission.query.filter_by(assignment_id=assignment_id, student_id=user_id).delete()

        db.session.add(new_sub)
        db.session.commit()

        # 8. Return Result (HIDDEN SCORES)
        return jsonify({
            'status': 'submitted',
            'message': 'Assignment submitted successfully. Analysis pending teacher review.',
            'is_published': False,
            'ai_detection': None, 
            'plagiarism': None,
            'grade': 'Pending',
            'marks': None
        }), 200

    except Exception as e:
        print(f"Grading Error: {e}")
        return jsonify({'error': str(e)}), 500


@content_bp.route('/submission/publish', methods=['POST'])
@jwt_required()
def publish_grade():
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity context'}), 401

    user = db.session.get(User, user_id)
    if not user or user.role != 'teacher': 
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json() or {}
    submission_id = data.get('submission_id')
    new_marks = data.get('marks') 
    new_grade = data.get('grade') 

    submission = db.session.get(Submission, submission_id)
    if not submission: 
        return jsonify({'error': 'Submission not found'}), 404

    # Fetch parent course assignment context to verify ownership maps
    assignment = db.session.get(Assignment, submission.assignment_id)
    course = Course.query.get(assignment.course_id) if assignment else None

    if not course or course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You are not the assigned instructor for this student entry.'}), 403

    if new_marks is not None: submission.obtained_marks = new_marks
    if new_grade is not None: submission.grade = new_grade
    
    submission.is_published = True 
    db.session.commit()

    return jsonify({'message': 'Grade updated and published successfully.'}), 200

@content_bp.route('/course/<int:course_id>/download-full-file', methods=['GET'])
@jwt_required()
def download_course_file(course_id):
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid identity token'}), 401
    
    from app.models.models import Course 
    course = Course.query.get_or_404(course_id)
    
    if course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You do not hold export clearances for this course section.'}), 403
        
    zip_data = CourseFileService.generate_course_zip(course)
    zip_data.seek(0)
    
    return send_file(
        zip_data,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f"{course.name.replace(' ', '_')}_Record.zip"
    )