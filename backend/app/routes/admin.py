from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import db, User, Course, Material, Announcement, CourseFeedback, Assignment, Submission, Semester, Attendance, Quiz, QuizSubmission, ReportLog
from datetime import datetime, timedelta
from sqlalchemy import func
from werkzeug.security import generate_password_hash
from functools import wraps
import random
import csv
import io
import secrets
import string
from io import StringIO

admin_bp = Blueprint('admin', __name__)

# Enforce file limits: 5MB maximum upload size constraint
MAX_FILE_SIZE = 5 * 1024 * 1024  
ALLOWED_EXTENSIONS = {'csv'}

# ==========================================
# 🔐 SYSTEM SECURITY DECORATORS (RBAC)
# ==========================================

def admin_required():
    """
    Custom decorator to enforce strict administrative access controls.
    Eliminates developer risk of forgetting internal check blocks.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Authentication required'}), 401
                
                user = User.query.get(user_id)
                if not user or user.role != 'admin':
                    return jsonify({'error': 'Access denied. Administrative privileges required.'}), 403
                
                return f(*args, **kwargs)
            except Exception:
                return jsonify({'error': 'Security validation failure'}), 401
        return decorated_function
    return decorator

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- REFACTORED HELPER FUNCTIONS ---

def generate_email(name):
    # Sanitize and compile system matching uniform strings
    clean_name = name.lower().strip().replace(" ", ".")
    return f"{clean_name}@university.edu"

def generate_secure_temp_password():
    """
    Replaced old predictable names logic with high-entropy cryptographic strings.
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%^*"
    return ''.join(secrets.choice(alphabet) for _ in range(12))

def parse_time(time_str):
    try:
        return datetime.strptime(time_str.strip(), '%I:%M %p')
    except Exception:
        return None

def check_time_conflict(teacher_id, day, new_in_str, new_out_str):
    existing_courses = Course.query.filter_by(teacher_id=teacher_id, day=day).all()
    new_start = parse_time(new_in_str)
    new_end = parse_time(new_out_str)
    
    if not new_start or not new_end:
        return None

    for c in existing_courses:
        if c.time_in and c.time_out:
            exist_start = parse_time(c.time_in)
            exist_end = parse_time(c.time_out)
            
            if exist_start and exist_end:
                if new_start < exist_end and new_end > exist_start:
                    return f"Conflict with {c.class_code} ({c.time_in} - {c.time_out})"
    return None

# ==========================================
# 1. TIMETABLE BATCH PROCESSING
# ==========================================

@admin_bp.route('/upload-schedule', methods=['POST'])
@jwt_required()
@admin_required()  # Secured
def upload_schedule_csv():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Security Fix: Enforce exact file extensions explicitly
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file format. Only CSV files are accepted.'}), 400

    try:
        # Security Fix: Measure incoming binary content length streams to block buffer overflows
        file.stream.seek(0, io.SEEK_END)
        size = file.stream.tell()
        if size > MAX_FILE_SIZE:
            return jsonify({'error': 'File payload exceeds maximum secure limit (5MB).'}), 413
        file.stream.seek(0) # Reset stream tracker back to zero

        file_bytes = file.stream.read()
        try:
            decoded_file = file_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            decoded_file = file_bytes.decode('latin-1')

        stream = io.StringIO(decoded_file, newline=None)
        csv_input = csv.DictReader(stream)
    except Exception as e:
        return jsonify({'error': f'Failed to process file stream safely: {str(e)}'}), 400

    report = {
        'created_teachers': [],
        'courses_created': 0,
        'courses_updated': 0,
        'conflicts': [],
        'errors': []
    }

    active_semester = Semester.query.filter_by(is_active=True).first() or Semester.query.first()
    if not active_semester:
        return jsonify({'error': 'No active semester context defined. Configuration required.'}), 400
    
    sem_id = active_semester.id

    try:
        for row_num, row in enumerate(csv_input, start=1):
            clean_row = {k.replace('\n', ' ').strip(): v.strip() for k, v in row.items() if k}

            instructor_name = clean_row.get('Instructor')
            institute_code = clean_row.get('Course Code')
            course_name = clean_row.get('Course Name')
            
            if not instructor_name or not course_name:
                continue

            day = clean_row.get('Day')
            time_in = clean_row.get('Time In')
            time_out = clean_row.get('Time Out')
            semester_val = clean_row.get('Semester')

            email = generate_email(instructor_name)
            teacher = User.query.filter_by(email=email).first()
            
            if not teacher:
                # Updated to use high-entropy random generation method strings
                temp_pass = generate_secure_temp_password()

                teacher = User(
                    username=instructor_name,
                    email=email,
                    role='teacher',
                    is_verified=True,
                    password_hash=generate_password_hash(temp_pass)
                )
                db.session.add(teacher)
                db.session.flush()
                
                report['created_teachers'].append({
                    'name': instructor_name, 'email': email, 'password': temp_pass
                })

            course = Course.query.filter_by(name=course_name, semester_code=semester_val).first()
            
            if not course:
                unique_class_code = str(random.randint(10000, 99999))
                while Course.query.filter_by(class_code=unique_class_code).first():
                    unique_class_code = str(random.randint(10000, 99999))

                course = Course(
                    name=course_name,
                    course_catalog_code=institute_code,
                    class_code=unique_class_code,
                    teacher_id=teacher.id,
                    semester_id=sem_id,
                    program=clean_row.get('Program'),
                    semester_code=semester_val,
                    shift=clean_row.get('Shift'),
                    credit_hours=clean_row.get('Credit Hours'),
                    day=day,
                    time_in=time_in,
                    time_out=time_out,
                    room=clean_row.get('Room')
                )
                db.session.add(course)
                report['courses_created'] += 1
            else:
                course.teacher_id = teacher.id
                course.day = day
                course.time_in = time_in
                course.time_out = time_out
                course.room = clean_row.get('Room')
                report['courses_updated'] += 1

        db.session.commit()
        return jsonify({'message': 'Batch process complete', 'report': report}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database transaction storage failure'}), 500

# ==========================================
# 2. SYSTEM METRICS OVERVIEW
# ==========================================

@admin_bp.route('/overview', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def get_overview():
    try:
        students_count = User.query.filter_by(role='student').count()
        teachers_count = User.query.filter_by(role='teacher').count()
        courses_count = Course.query.count()
        submissions_count = Submission.query.count()

        recent_users_query = User.query.order_by(User.id.desc()).limit(5).all()
        recent_users_list = [{
            'username': u.username, 
            'role': u.role, 
            'date': 'Recently' 
        } for u in recent_users_query]

        recent_subs_query = Submission.query.order_by(Submission.submitted_at.desc()).limit(5).all()
        recent_subs_list = []
        for sub in recent_subs_query:
            recent_subs_list.append({
                'student': sub.student.username if sub.student else 'Unknown',
                'assignment': sub.assignment.title if sub.assignment else 'Task',
                'date': sub.submitted_at.strftime('%Y-%m-%d')
            })

        chart_data = []
        today = datetime.utcnow().date()
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            start_of_day = datetime.combine(day, datetime.min.time())
            end_of_day = datetime.combine(day, datetime.max.time())
            
            count = Submission.query.filter(
                Submission.submitted_at >= start_of_day,
                Submission.submitted_at <= end_of_day
            ).count()
            
            chart_data.append({
                'name': day.strftime('%a'),
                'submissions': count
            })

        return jsonify({
            'kpi': {
                'students': students_count,
                'teachers': teachers_count,
                'courses': courses_count,
                'submissions': submissions_count
            },
            'activity': {
                'new_users': recent_users_list,
                'submissions': recent_subs_list
            },
            'chart': chart_data
        }), 200

    except Exception as e:
        return jsonify({'error': 'Server error parsing system statistics overview'}), 500

# ==========================================
# 3. IDENTITY CONTROL WORKFLOWS
# ==========================================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def get_users():
    users = User.query.order_by(User.id.desc()).all()
    return jsonify({
        'users': [{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role
        } for u in users]
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required()  # Secured
def update_user_role(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    
    if 'role' in data:
        # Enforce strict assignment parameters to block malicious privilege escalation attempts
        if data['role'] in ['student', 'teacher', 'admin']:
            user.role = data['role']
    
    db.session.commit()
    return jsonify({'message': 'User role updated successfully'}), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required()  # Secured
def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        current_id = int(get_jwt_identity())
        if user.id == current_id:
            return jsonify({'error': 'Cannot self-terminate active administrative seat scope.'}), 400
            
        db.session.delete(user)
        db.session.commit()
    return jsonify({'message': 'User account context dropped successfully.'}), 200

# ==========================================
# 4. SCHEDULING MANAGEMENT
# ==========================================

@admin_bp.route('/courses', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def get_all_courses_admin():
    courses = Course.query.all()
    output = []
    for course in courses:
        display_time = None
        if course.time_in:
            display_time = course.time_in
            if course.time_out:
                display_time += f" - {course.time_out}"

        output.append({
            'id': course.id,
            'name': course.name,
            'class_code': course.class_code,
            'teacher_name': course.teacher.username if course.teacher else "No Teacher",
            'teacher_email': course.teacher.email if course.teacher else "N/A",
            'is_attendance_locked': course.is_attendance_locked,
            'student_count': len(course.enrollments),
            'course_catalog_code': course.course_catalog_code, 
            'program': course.program,        
            'semester_code': course.semester_code, 
            'shift': course.shift,            
            'room': course.room,              
            'day': course.day,
            'time': display_time 
        })
        
    return jsonify({'courses': output}), 200

@admin_bp.route('/course/<int:course_id>', methods=['DELETE'])
@jwt_required()
@admin_required()  # Secured
def delete_course(course_id):
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Course target reference not found'}), 404

    try:
        Attendance.query.filter_by(course_id=course.id).delete()
        assignments = Assignment.query.filter_by(course_id=course.id).all()
        for asn in assignments:
            Submission.query.filter_by(assignment_id=asn.id).delete()
            db.session.delete(asn)

        Material.query.filter_by(course_id=course.id).delete()
        course.students = [] 

        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'Course parameters dropped successfully.'}), 200

    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to safely clear cascading course targets.'}), 500

# ==========================================
# 5. SEMESTER TIMEFRAMES
# ==========================================

@admin_bp.route('/semesters', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def get_semesters():
    semesters = Semester.query.order_by(Semester.id.desc()).all()
    output = [{
        'id': s.id,
        'name': s.name,
        'academic_year': s.academic_year,
        'start_date': s.start_date,
        'end_date': s.end_date,
        'is_active': s.is_active
    } for s in semesters]
    return jsonify({'semesters': output}), 200

@admin_bp.route('/semester', methods=['POST'])
@jwt_required()
@admin_required()  # Secured
def create_semester():
    data = request.get_json()
    new_sem = Semester(
        name=data['name'],
        academic_year=data['academic_year'],
        start_date=data['start_date'],
        end_date=data['end_date'],
        is_active=True
    )
    db.session.add(new_sem)
    db.session.commit()
    return jsonify({'message': 'Created'}), 201

@admin_bp.route('/semester/<int:id>/toggle', methods=['PUT'])
@jwt_required()
@admin_required()  # Secured
def toggle_semester(id):
    sem = Semester.query.get(id)
    if sem:
        sem.is_active = not sem.is_active
        db.session.commit()
        return jsonify({'message': 'Updated'}), 200
    return jsonify({'error': 'Not found'}), 404

# ==========================================
# 6. INTERVENTION MONITORING & DATA LOGS
# ==========================================

@admin_bp.route('/course/<int:course_id>/unlock', methods=['PUT'])
@jwt_required()
@admin_required()  # Secured
def unlock_attendance(course_id):
    course = Course.query.get(course_id)
    if course:
        course.is_attendance_locked = False
        db.session.commit()
        return jsonify({'message': 'Unlocked'}), 200
    return jsonify({'error': 'Not found'}), 404

@admin_bp.route('/course/<int:course_id>/export_attendance', methods=['GET'])
@jwt_required()
@admin_required()  
def export_attendance_excel(course_id):
    course = Course.query.get(course_id)
    if not course: return jsonify({'error': 'Not found'}), 404
    
    records = Attendance.query.filter_by(course_id=course_id).all()
    
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Date', 'Student', 'Status'])
    
    for r in records:
        s = User.query.get(r.student_id)
        cw.writerow([r.date, s.username if s else 'Unknown', r.status])

    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = f"attachment; filename=Attendance_{course_id}.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
@admin_required()  # ✅ Added Critical Security: Staged metric scope visibility parameters behind authorization layer
def get_reports():
    logs = ReportLog.query.order_by(ReportLog.date.desc()).all()
    if not logs:
        return jsonify({'reports': [
            {"date": "2025-01-01", "generations": 10, "users": 5},
            {"date": "2025-01-02", "generations": 20, "users": 8}
        ]}), 200
        
    return jsonify({'reports': [
        {"date": l.date, "generations": l.generations, "users": l.users} for l in logs
    ]}), 200

@admin_bp.route('/course/<int:course_id>/schedule', methods=['PUT'])
@jwt_required()
@admin_required()  # Secured
def update_course_schedule(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    data = request.json
    if 'day' in data:
        course.day = data['day']
    if 'time' in data:
        course.time_in = data['time'] 
    if 'room' in data:
        course.room = data['room']

    try:
        db.session.commit()
        return jsonify({'message': 'Schedule updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save schedule structural edits.'}), 500
    
@admin_bp.route('/export-schedule', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def export_final_schedule():
    courses = Course.query.all()
    day_order = {
        'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 
        'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7,
        '': 8, None: 8, 'Not Set': 8
    }

    courses.sort(key=lambda x: (
        x.semester_code or "Z",          
        day_order.get(x.day, 8),         
        x.time_in or "23:59"             
    ))

    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Course Code', 'Course Name', 'Instructor', 'Program', 'Semester', 'Day', 'Time In', 'Time Out', 'Room'])

    def format_time(t_str):
        if not t_str: return "-"
        try:
            dt = datetime.strptime(t_str, "%H:%M")
            return dt.strftime("%I:%M %p")
        except Exception:
            return t_str

    for c in courses:
        teacher_name = c.teacher.username if c.teacher else "Unassigned"
        fmt_time_in = format_time(c.time_in)
        fmt_time_out = format_time(c.time_out)
        
        cw.writerow([
            c.course_catalog_code or "-",
            c.name,
            teacher_name,
            c.program or "-",
            c.semester_code or "-",
            c.day or "-",
            c.time_in,
            c.time_out,
            c.room or "-"
        ])

    output = make_response(si.getvalue())
    filename = f"Final_Schedule_{datetime.now().strftime('%Y-%m-%d')}.csv"
    output.headers["Content-Disposition"] = f"attachment; filename={filename}"
    output.headers["Content-type"] = "text/csv"
    return output

# --- ANNOUNCEMENT SYSTEM ---

@admin_bp.route('/announcements', methods=['GET'])
def get_announcements():
    # Public announcement fetch route remain open safely
    anns = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify({'announcements': [{
        'id': a.id,
        'content': a.content,
        'type': a.type,
        'date': a.created_at.strftime('%Y-%m-%d %H:%M')
    } for a in anns]}), 200

@admin_bp.route('/announcement', methods=['POST'])
@jwt_required()
@admin_required()  # Secured
def create_announcement():
    data = request.get_json()
    new_ann = Announcement(
        content=data['content'],
        type=data.get('type', 'info')
    )
    db.session.add(new_ann)
    db.session.commit()
    return jsonify({'message': 'Posted!'}), 201

@admin_bp.route('/announcement/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required()  # Secured
def delete_announcement(id):
    ann = Announcement.query.get(id)
    if ann:
        db.session.delete(ann)
        db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@admin_bp.route('/feedback-stats', methods=['GET'])
@jwt_required()
@admin_required()  # Secured
def get_feedback_stats():
    results = db.session.query(
        CourseFeedback, 
        Course.name, 
        User.username  
    ).join(Course, CourseFeedback.course_id == Course.id)\
     .join(User, Course.teacher_id == User.id).all()

    data = []
    for fb, course_name, teacher_name in results:
        data.append({
            'id': fb.id,
            'course': course_name,
            'teacher': teacher_name, 
            'rating': fb.rating,
            'comment': fb.comment,
            'date': fb.created_at.strftime('%Y-%m-%d')
        })

    return jsonify({'reviews': data}), 200