from flask import send_file, Blueprint, jsonify, request
import io
from openpyxl import Workbook
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.models.models import db, User, Course, Material, Assignment, Submission, Enrollment

dashboard_bp = Blueprint('dashboard', __name__)

# --- GET COURSES (For Dashboard List) ---
@dashboard_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    courses_data = []

    # Logic: Teachers see courses they teach; Students see courses they are enrolled in
    if user.role == 'teacher':
        courses = Course.query.filter_by(teacher_id=user_id).all()
        for course in courses:
            courses_data.append({
                'id': course.id,
                'name': course.name,
                'class_code': course.class_code,
                'teacher_name': user.username,
                'student_count': len(course.enrollments),
                
                # ADDED NEW METADATA FIELDS
                'course_catalog_code': course.course_catalog_code, # e.g. "CSC 101"
                'program': course.program,        # e.g. "BSCS"
                'semester_code': course.semester_code, # e.g. "I-A"
                'shift': course.shift,            # e.g. "Morning"
                'semester_name': course.semester.name if course.semester else ''
            })
    else:
        # For students, get courses from their enrollments
        for enrollment in user.enrollments:
            course = enrollment.course
            if course:
                courses_data.append({
                    'id': course.id,
                    'name': course.name,
                    'class_code': course.class_code,
                    'teacher_name': course.teacher.username if course.teacher else 'Unknown',
                    'student_count': len(course.enrollments),
                    
                    # ADDED NEW METADATA FIELDS FOR STUDENTS TOO
                    'course_catalog_code': course.course_catalog_code,
                    'program': course.program,
                    'semester_code': course.semester_code,
                    'shift': course.shift,
                    'semester_name': course.semester.name if course.semester else ''
                })

    return jsonify({'courses': courses_data}), 200

@dashboard_bp.route('/teacher', methods=['GET'])
@jwt_required()
def teacher_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role != 'teacher':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get teacher's courses
    courses = Course.query.filter_by(teacher_id=user_id).all()
    
    total_students = db.session.query(func.count(Enrollment.id)).join(Course).filter(
        Course.teacher_id == user_id
    ).scalar()
    
    total_materials = db.session.query(func.count(Material.id)).join(Course).filter(
        Course.teacher_id == user_id
    ).scalar()
    
    total_assignments = db.session.query(func.count(Assignment.id)).join(Course).filter(
        Course.teacher_id == user_id
    ).scalar()
    
    dashboard_data = {
        'total_courses': len(courses),
        'total_students': total_students or 0,
        'total_materials': total_materials or 0,
        'total_assignments': total_assignments or 0,
        'courses': []
    }
    
    for course in courses:
        course_students = len(course.enrollments)
        course_materials = len(course.materials)
        course_assignments = len(course.assignments)
        
        # Count pending submissions
        pending_submissions = 0
        for assignment in course.assignments:
            submissions_count = len(assignment.submissions)
            pending_submissions += (course_students - submissions_count)
        
        dashboard_data['courses'].append({
            'id': course.id,
            'name': course.name,
            'class_code': course.class_code, # Added this just in case
            'description': course.description,
            'total_students': course_students,
            'total_materials': course_materials,
            'total_assignments': course_assignments,
            'pending_submissions': pending_submissions,

            'course_catalog_code': course.course_catalog_code,
            'program': course.program,
            'semester_code': course.semester_code,
            'shift': course.shift,
            'semester_name': course.semester.name if course.semester else ''
        })
    
    return jsonify(dashboard_data), 200

@dashboard_bp.route('/student', methods=['GET'])
@jwt_required()
def student_dashboard():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role != 'student':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get enrolled courses
    enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    
    dashboard_data = {
        'total_courses': len(enrollments),
        'courses': [],
        'pending_assignments': [],
        'completed_assignments': 0
    }
    
    for enrollment in enrollments:
        course = enrollment.course
        dashboard_data['courses'].append({
            'id': course.id,
            'name': course.name,
            'class_code': course.class_code, # Added class code
            'description': course.description,
            'teacher': course.teacher.username,
            'total_materials': len(course.materials),
            'total_assignments': len(course.assignments),
            
            'course_catalog_code': course.course_catalog_code,
            'program': course.program,
            'semester_code': course.semester_code,
            'shift': course.shift,
            'semester_name': course.semester.name if course.semester else ''
        })
        
        # Get assignments
        for assignment in course.assignments:
            submission = Submission.query.filter_by(
                assignment_id=assignment.id,
                student_id=user_id
            ).first()
            
            if submission:
                dashboard_data['completed_assignments'] += 1
            else:
                dashboard_data['pending_assignments'].append({
                    'id': assignment.id,
                    'title': assignment.title,
                    'course': course.name,
                    'course_id': course.id,
                    'deadline': assignment.deadline.isoformat() if assignment.deadline else None,
                    'created_at': assignment.created_at.isoformat()
                })
    
    return jsonify(dashboard_data), 200

@dashboard_bp.route('/enroll/<code>', methods=['POST'])
@jwt_required()
def enroll_in_course(code):
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user or user.role != 'student':
            return jsonify({'error': 'Administrative or instructional roles cannot execute student enrollment routines.'}), 403
        
        course = Course.query.filter_by(class_code=str(code)).first()
        if not course:
            return jsonify({'error': 'Invalid Class Code'}), 404
            
        existing = Enrollment.query.filter_by(student_id=user_id, course_id=course.id).first()
        if existing:
            return jsonify({'message': 'Already enrolled'}), 200
            
        new_enrollment = Enrollment(student_id=user_id, course_id=course.id)
        db.session.add(new_enrollment)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully enrolled',
            'course': {
                'id': course.id,
                'name': course.name,
                'teacher': course.teacher.username
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Server Error during secure enrollment compilation'}), 500

# --- OPTIONAL: ENROLL BY ID (If accessed directly) ---
@dashboard_bp.route('/enroll-id/<int:course_id>', methods=['POST'])
@jwt_required()
def enroll_course_by_id(course_id):
    user_id = int(get_jwt_identity())
    
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course not found'}), 404
    
    existing = Enrollment.query.filter_by(student_id=user_id, course_id=course_id).first()
    if existing: return jsonify({'error': 'Already enrolled'}), 400
    
    enrollment = Enrollment(student_id=user_id, course_id=course_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'message': 'Enrolled successfully'}), 201

@dashboard_bp.route('/courses/all', methods=['GET'])
@jwt_required()
def get_all_courses():
    """Get all available courses for enrollment"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    courses = Course.query.all()
    
    result = []
    for course in courses:
        # Check if student is enrolled
        is_enrolled = False
        if user.role == 'student':
            enrollment = Enrollment.query.filter_by(
                student_id=user_id,
                course_id=course.id
            ).first()
            is_enrolled = enrollment is not None
        
        result.append({
            'id': course.id,
            'name': course.name,
            'description': course.description,
            'teacher': course.teacher.username,
            'total_students': len(course.enrollments),
            'is_enrolled': is_enrolled
        })
    
    return jsonify({'courses': result}), 200

@dashboard_bp.route('/export-students/<int:course_id>', methods=['GET'])
@jwt_required()
def export_students(course_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'teacher':
        return jsonify({'error': 'Unauthorized access tier.'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course parameters not found.'}), 404

    if course.teacher_id != user.id:
        return jsonify({'error': 'Access denied. You are not the assigned instructor for this section.'}), 403

    # Create Excel Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Enrolled Students"

    # Header Row
    ws.append(["University ID", "Student Name", "Email", "Submissions Count", "Assignments Submitted"])

    # Data Rows
    for enrollment in course.enrollments:
        student = enrollment.student
        submitted_titles = []
        submission_count = 0
        
        for assignment in course.assignments:
            sub = Submission.query.filter_by(
                assignment_id=assignment.id, 
                student_id=student.id
            ).first()
            
            if sub:
                submitted_titles.append(assignment.title)
                submission_count += 1
        
        ws.append([
            student.university_id or "N/A",
            student.username,
            student.email,
            submission_count,
            ", ".join(submitted_titles)
        ])

    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    return send_file(
        excel_file,
        as_attachment=True,
        download_name=f"{course.name}_Students.xlsx",
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@dashboard_bp.route('/course/<int:course_id>/students', methods=['GET'])
@jwt_required()
def get_course_students(course_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # Security: Only allow teacher of the course to see this
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    if user.role == 'teacher' and course.teacher_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    students_list = []
    for enrollment in course.enrollments:
        student = enrollment.student
        students_list.append({
            'id': student.id,
            'username': student.username,
            'email': student.email,
            'university_id': student.university_id,
            'enrolled_at': enrollment.enrolled_at.strftime('%Y-%m-%d')
        })
        
    return jsonify({'students': students_list}), 200

@dashboard_bp.route('/course/<int:course_id>/student/<int:student_id>', methods=['DELETE'])
@jwt_required()
def remove_student(course_id, student_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404
        
    # Only the teacher of the course can remove students
    if user.role != 'teacher' or course.teacher_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Find enrollment
    enrollment = Enrollment.query.filter_by(course_id=course_id, student_id=student_id).first()
    if not enrollment:
        return jsonify({'error': 'Student not enrolled'}), 404
        
    db.session.delete(enrollment)
    db.session.commit()
    
    return jsonify({'message': 'Student removed successfully'}), 200

@dashboard_bp.route('/search-course/<code>', methods=['GET'])
@jwt_required()
def search_course(code):
    course = Course.query.filter_by(class_code=str(code)).first()
    
    if not course:
        return jsonify({'found': False, 'message': 'Invalid Class Number'}), 404
        
    return jsonify({
        'found': True,
        'course': {
            'id': course.id,
            'name': course.name,
            'teacher_name': course.teacher.username,
            'teacher_email': course.teacher.email,
            'student_count': len(course.enrollments),
            # Metadata for search result (optional)
            'program': course.program,
            'shift': course.shift,
            'semester_code': course.semester_code
        }
    }), 200

# --- STUDENT LEAVE COURSE (Unenroll) ---
@dashboard_bp.route('/enrollment/<int:course_id>', methods=['DELETE'])
@jwt_required()
def leave_course(course_id):
    user_id = int(get_jwt_identity())
    
    # Find the specific enrollment
    enrollment = Enrollment.query.filter_by(student_id=user_id, course_id=course_id).first()
    
    if not enrollment:
        return jsonify({'error': 'You are not enrolled in this course'}), 404

    try:
        # Only delete the enrollment record, NOT the course data
        db.session.delete(enrollment)
        db.session.commit()
        return jsonify({'message': 'Successfully dropped course'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500