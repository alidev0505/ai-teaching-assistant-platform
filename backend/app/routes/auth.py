from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.models import db, User, Course, Enrollment, Material, GeneratedContent
from datetime import datetime, timedelta
import smtplib
import secrets
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
auth_bp = Blueprint('auth', __name__)


# ── Helper: Password Complexity Validation ──────────────────────────────────
def is_strong_password(password):
    """
    Enforces password complexity requirements:
    Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.
    """
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_+\-=\[\]]", password):
        return False
    return True


# ── Helper: Safe JWT Identity Extractor ────────────────────────────────────
def get_authenticated_user_id():
    """
    Standardized, exception-safe identification reader across token types.
    Ensures structural defense against payload mutations.
    """
    try:
        identity = get_jwt_identity()
        if not identity:
            return None
        if isinstance(identity, dict):
            return int(identity.get('id'))
        return int(identity)
    except (ValueError, TypeError):
        return None


# ── Helper: send email via SMTP ─────────────────────────────────────────────
def send_email(to_email, subject, html_body):
    """Send an email using the SMTP credentials stored in environment variables."""
    try:
        # Fetch directly from the environment to match your .env file
        username = os.environ.get('SMTP_EMAIL') or current_app.config.get('MAIL_USERNAME', '')
        password = os.environ.get('SMTP_PASSWORD') or current_app.config.get('MAIL_PASSWORD', '')
        
        # Hardcode Gmail server defaults since you are using Gmail
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', 587))

        if not username or not password or username == 'your-gmail@gmail.com':
            print("⚠️ SMTP credentials not configured.")
            return False

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = username
        msg['To'] = to_email
        msg.attach(MIMEText(html_body, 'html'))

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(username, password)
            server.sendmail(username, to_email, msg.as_string())

        return True
    except Exception as e:
        print(f"❌ Unexpected email error: {type(e).__name__} - {str(e)}")
        return False


# ── Signup ───────────────────────────────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not all(k in data for k in ('username', 'email', 'password', 'role')):
        return jsonify({'error': 'Missing required fields'}), 400

    if data['role'] not in ['teacher', 'student']:
        return jsonify({'error': 'Invalid registration role request.'}), 400

    # Security Fix: Enforce minimum complexity rule thresholds on user password registration
    if not is_strong_password(data['password']):
        return jsonify({'error': 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.'}), 400

    # Check if user exists
    if User.query.filter_by(email=data['email'].strip().lower()).first():
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username'].strip()).first():
        return jsonify({'error': 'Username already taken'}), 400

    hashed_password = generate_password_hash(data['password'])
    verification_token = secrets.token_urlsafe(32)

    new_user = User(
        username=data['username'].strip(),
        email=data['email'].strip().lower(),
        password_hash=hashed_password,
        role=data['role'], # Strictly validated as student or teacher above
        university_id=data.get('university_id', '').strip(),
        is_verified=False,
        verification_token=verification_token
    )

    db.session.add(new_user)
    db.session.commit()

    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    verify_link = f"{frontend_url}/verify-email/{verification_token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">Verify Your Email</h2>
      <p>Hi <b>{new_user.username}</b>, thanks for signing up!</p>
      <p>Click the button below to verify your email address:</p>
      <a href="{verify_link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
        Verify Email
      </a>
    </div>
    """
    send_email(new_user.email, "Verify your AI Teaching Assistant account", html)

    return jsonify({
        'message': 'User created successfully. Please check your email to verify your account.'
    }), 201


# ── Verify Email ─────────────────────────────────────────────────────────────
@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    # Security Validation: Block processing on empty tokens explicitly
    if not token or len(token.strip()) == 0:
        return jsonify({'error': 'Malformed verification request token token.'}), 400

    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({'error': 'Invalid or expired verification link.'}), 400

    if user.is_verified:
        return jsonify({'message': 'Email already verified. You can log in.'}), 200

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    return jsonify({'message': 'Email verified successfully! You can now log in.'}), 200


# ── Login ─────────────────────────────────────────────────────────────────────
# ── Login ─────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid request payload'}), 400
            
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.password_hash:
            return jsonify({'error': 'Invalid credentials'}), 401

        try:
            is_valid = check_password_hash(user.password_hash, password)
        except Exception as hash_err:
            print(f"⚠️ Password check error: {hash_err}")
            is_valid = False

        if not is_valid:
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.is_verified and user.role == 'student':
            return jsonify({
                'error': 'Please verify your email before logging in. Check your inbox for the verification link.',
                'code': 'EMAIL_NOT_VERIFIED'
            }), 403

        try:
            access_token = create_access_token(identity=str(user.id))
        except Exception as token_err:
            print(f"⚠️ Token generation error: {token_err}")
            return jsonify({'error': 'Token creation failed'}), 500

        return jsonify({
            'access_token': access_token,
            'token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        }), 200

    except Exception as e:
        print(f"🔥 CRITICAL LOGIN EXCEPTION: {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server authentication error'}), 500


# ── Forgot Password ───────────────────────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return 200 to avoid revealing whether email exists (Mitigates User Enumeration)
    if not user:
        return jsonify({'message': 'If an account with that email exists, a reset link has been sent.'}), 200

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password/{token}"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#4f46e5">Reset Your Password</h2>
      <p>Hi <b>{user.username}</b>,</p>
      <p>We received a request to reset your password. Click the button below — this link expires in <b>1 hour</b>:</p>
      <a href="{reset_link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
        Reset Password
      </a>
    </div>
    """
    send_email(user.email, "Reset your AI Teaching Assistant password", html)

    return jsonify({'message': 'If an account with that email exists, a reset link has been sent.'}), 200


# ── Reset Password ────────────────────────────────────────────────────────────
@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    new_password = data.get('new_password', '')

    if not new_password or not is_strong_password(new_password):
        return jsonify({'error': 'Password fails minimal secure selection configuration settings policy.'}), 400

    if not token or len(token.strip()) == 0:
        return jsonify({'error': 'Invalid operation parameter.'}), 400

    user = User.query.filter_by(reset_token=token).first()

    if not user:
        return jsonify({'error': 'Invalid or expired reset link.'}), 400

    if user.reset_token_expires < datetime.utcnow():
        return jsonify({'error': 'This reset link has expired. Please request a new one.'}), 400

    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200


# ── Get Current User ──────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({'error': 'Invalid security signature structure'}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User context lost'}), 404

        return jsonify({'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'university_id': user.university_id or '',
            'is_verified': user.is_verified,
            'created_at': user.created_at.strftime('%B %d, %Y') if user.created_at else 'N/A',
        }}), 200
    except Exception:
        return jsonify({'error': 'Security tracking error context processing tokens'}), 401


# ── Profile Stats ─────────────────────────────────────────────────────────────
@auth_bp.route('/profile-stats', methods=['GET'])
@jwt_required()
def get_profile_stats():
    try:
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({'error': 'Invalid identity context'}), 401
            
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        stats = {}
        if user.role == 'teacher':
            courses = Course.query.filter_by(teacher_id=user_id).all()
            course_ids = [c.id for c in courses]
            total_students = sum(Enrollment.query.filter_by(course_id=cid).count() for cid in course_ids)
            
            material_ids = [m.id for m in Material.query.filter(Material.course_id.in_(course_ids)).all()] if course_ids else []
            gen_counts = {'lecture': 0, 'slides': 0, 'assignment': 0, 'quiz': 0, 'midterm': 0, 'final': 0}
            if material_ids:
                for gc in GeneratedContent.query.filter(GeneratedContent.material_id.in_(material_ids)).all():
                    ct = gc.content_type.lower()
                    if ct in gen_counts:
                        gen_counts[ct] += 1
                    else:
                        gen_counts['quiz'] += 1
            
            stats = {
                'courses_taught': len(courses),
                'total_students': total_students,
                'generated': gen_counts,
                'courses': [{'id': c.id, 'name': c.name, 'code': c.class_code} for c in courses]
            }
        elif user.role == 'student':
            enrollments = Enrollment.query.filter_by(student_id=user_id).all()
            stats = {
                'courses_enrolled': len(enrollments),
                'university_id': user.university_id or 'Not set',
                'courses': [{
                    'id': e.course_id,
                    'name': e.course.name if e.course else 'Unknown',
                    'code': e.course.class_code if e.course else '',
                    'teacher': e.course.teacher.username if e.course and e.course.teacher else 'Unknown'
                } for e in enrollments]
            }
        elif user.role == 'admin':
            stats = {
                'total_users': User.query.count(),
                'total_teachers': User.query.filter_by(role='teacher').count(),
                'total_students': User.query.filter_by(role='student').count(),
                'total_courses': Course.query.count(),
            }

        return jsonify({'stats': stats}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to process metrics payload'}), 500


# ── Update Profile ────────────────────────────────────────────────────────────
@auth_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({'error': 'Identity mapping signature validation lost.'}), 401
            
        user = User.query.get(user_id)
        data = request.get_json()

        if 'username' in data and data['username'].strip():
            existing = User.query.filter_by(username=data['username'].strip()).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Username already taken'}), 400
            user.username = data['username'].strip()
            
        if 'email' in data and data['email'].strip():
            existing = User.query.filter_by(email=data['email'].strip().lower()).first()
            if existing and existing.id != user_id:
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email'].strip().lower()
            
        if 'university_id' in data:
            user.university_id = data['university_id'].strip()
        if 'department' in data:
            user.department = data['department'].strip()
        if 'bio' in data:
            user.bio = data['bio'].strip()
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'university_id': user.university_id or '',
            'is_verified': user.is_verified,
            'created_at': user.created_at.strftime('%B %d, %Y') if user.created_at else 'N/A',
        }}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Profile processing exception thrown.'}), 500


# ── Change Password (for logged-in users) ─────────────────────────────────────
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({'error': 'Session execution token reference lost.'}), 401
            
        user = User.query.get(user_id)
        data = request.get_json()

        old_pass = data.get('old_password', '')
        new_pass = data.get('new_password', '')

        if not check_password_hash(user.password_hash, old_pass):
            return jsonify({'error': 'Incorrect current password'}), 400

        # Enforce complexity checks on runtime password structural updates explicitly
        if not is_strong_password(new_pass):
            return jsonify({'error': 'New password fails target cryptographic criteria requirement vectors.'}), 400

        user.password_hash = generate_password_hash(new_pass)
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Transactional fault editing identity structures'}), 500