from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import secrets

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    university_id = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Extended profile fields
    department = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.String(500), nullable=True) # Capped to prevent database column blooming
    profile_picture = db.Column(db.String(50000), nullable=True) 

    # Password Reset
    reset_token = db.Column(db.String(64), nullable=True) # Normalizing to secure SHA-256 length hashes
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    # Email Verification
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(64), nullable=True)
    
    # Relationships
    courses_taught = db.relationship('Course', backref='teacher', lazy=True, foreign_keys='Course.teacher_id')
    enrollments = db.relationship('Enrollment', backref='student', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'university_id': self.university_id or '',
            'department': self.department or '',
            'bio': self.bio or '',
            'profile_picture': self.profile_picture or '',
            'is_verified': self.is_verified,
            'created_at': self.created_at.strftime('%B %d, %Y') if self.created_at else 'N/A',
        }


class Semester(db.Model):
    __tablename__ = 'semesters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False) # e.g., "Fall", "Spring"
    academic_year = db.Column(db.String(20), nullable=False) # e.g., "2025-2026"
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=True) # Only active semesters show in dropdowns
    
    # Relationship: One Semester has Many Courses
    courses = db.relationship('Course', backref='semester', lazy=True)

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    class_code = db.Column(db.String(10), unique=True, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    semester_id = db.Column(db.Integer, db.ForeignKey('semesters.id'), nullable=False)
    is_attendance_locked = db.Column(db.Boolean, default=False)
    
    program = db.Column(db.String(50))
    
    semester_code = db.Column(db.String(20)) 
    
    shift = db.Column(db.String(10))
    credit_hours = db.Column(db.String(10))
    day = db.Column(db.String(15))
    time_in = db.Column(db.String(15))
    time_out = db.Column(db.String(15))
    room = db.Column(db.String(50))
    course_catalog_code = db.Column(db.String(20))
    
    # Relationships
    materials = db.relationship('Material', backref='course', lazy=True, cascade='all, delete-orphan')
    assignments = db.relationship('Assignment', backref='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='course', lazy=True, cascade='all, delete-orphan')

class Material(db.Model):
    __tablename__ = 'materials'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(20), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_processed = db.Column(db.Boolean, default=False)

class GeneratedContent(db.Model):
    __tablename__ = 'generated_content'
    
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materials.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True) 
    
    content_type = db.Column(db.String(50), nullable=False)  # 'lecture', 'quiz', 'assignment', 'exam'
    content = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Assignment(db.Model):
    __tablename__ = 'assignments'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text) 
    file_path = db.Column(db.String(500)) 
    deadline = db.Column(db.DateTime)
    
    teacher_solution = db.Column(db.Text, nullable=True) 

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    submissions = db.relationship('Submission', backref='assignment', lazy=True, cascade='all, delete-orphan')

class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    answer_text = db.Column(db.Text, nullable=True) 

    content = db.Column(db.Text) 
    file_path = db.Column(db.String(500)) 
    
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='submitted')  # 'submitted', 'reviewed'
    
    ai_score = db.Column(db.Float, default=0.0)         # 0.0 to 1.0 (60% = 0.6)
    plagiarism_score = db.Column(db.Float, default=0.0) # 0.0 to 1.0
    similarity_score = db.Column(db.Float, default=0.0) # 0.0 to 1.0 (Teacher match)
    grade = db.Column(db.String(5), default='N/A')      # A, B, C, F
    obtained_marks = db.Column(db.Float, default=0.0)
    feedback = db.Column(db.Text, nullable=True)        # Automated feedback string

    is_published = db.Column(db.Boolean, default=False)

    student = db.relationship('User', backref=db.backref('submissions', passive_deletes=True))

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class LiveSession(db.Model):
    __tablename__ = 'live_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    start_time = db.Column(db.DateTime, nullable=False)
    meeting_link = db.Column(db.String(255), nullable=False) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    course = db.relationship('Course', backref='sessions')

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(10), nullable=False) # 'Present', 'Absent', 'Late'
    session_number = db.Column(db.Integer) # 1 to 16

    # Relationships (Optional but helpful)
    student = db.relationship('User', backref='attendance_records')

# --- UPDATED QUIZ MODELS ---

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    time_limit_minutes = db.Column(db.Integer, default=10)
    deadline = db.Column(db.DateTime, nullable=True)
    is_published = db.Column(db.Boolean, default=False)  # This is the "Assign" toggle
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='quiz', cascade='all, delete-orphan')
    submissions = db.relationship('QuizSubmission', backref='quiz', lazy=True, cascade='all, delete-orphan')

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(200), nullable=False)
    option_b = db.Column(db.String(200), nullable=False)
    option_c = db.Column(db.String(200), nullable=False)
    option_d = db.Column(db.String(200), nullable=False)
    correct_option = db.Column(db.String(1), nullable=False) # 'A', 'B', 'C', or 'D'

class QuizSubmission(db.Model):
    __tablename__ = 'quiz_submissions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, default=0.0) 
    total_questions = db.Column(db.Integer, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to detailed answers
    answers = db.relationship('StudentAnswer', backref='submission', lazy=True, cascade='all, delete-orphan')

class StudentAnswer(db.Model):
    """Tracks specific choice for each question for review later"""
    __tablename__ = 'student_answers'
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('quiz_submissions.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    selected_option = db.Column(db.String(1), nullable=False) 
    is_correct = db.Column(db.Boolean, nullable=False)


class ReportLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    generations = db.Column(db.Integer, default=0)
    users = db.Column(db.Integer, default=0)

class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    type = db.Column(db.String(20), default='info') # info, warning, alert
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Optional: Target audience (all, student, teacher)
    target = db.Column(db.String(20), default='all')

class CourseFeedback(db.Model):
    __tablename__ = 'course_feedback'  
    
    id = db.Column(db.Integer, primary_key=True)
    
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) 
    
    rating = db.Column(db.Integer, nullable=False) 
    comment = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    course = db.relationship('Course', backref='feedbacks')
    student = db.relationship('User', backref='given_feedbacks')