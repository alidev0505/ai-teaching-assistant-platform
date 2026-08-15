from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.models import db, User, Course, Quiz, Question, QuizSubmission
from datetime import datetime

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/create', methods=['POST'])
@jwt_required()
def create_quiz():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.role != 'teacher': return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    
    try:
        is_published = data.get('is_published', False)
        deadline_str = data.get('deadline')
        deadline = datetime.fromisoformat(deadline_str) if deadline_str else None

        c_id = int(data['course_id'])
        
        target_course = Course.query.get(c_id)
        if not target_course or target_course.teacher_id != user_id:
            return jsonify({'error': 'Unauthorized course assignment context target.'}), 403

        new_quiz = Quiz(
            course_id=c_id,
            title=data['title'],
            description=data.get('description', ''),
            time_limit_minutes=int(data.get('time_limit', 10)),
            is_published=is_published,
            deadline=deadline
        )
        db.session.add(new_quiz)
        db.session.flush() # Gets the ID for questions

        for q in data['questions']:
            new_q = Question(
                quiz_id=new_quiz.id,
                text=q['text'],
                option_a=q['options']['A'],
                option_b=q['options']['B'],
                option_c=q['options']['C'],
                option_d=q['options']['D'],
                correct_option=q['correct']
            )
            db.session.add(new_q)
        
        db.session.commit() 
        print(f"SUCCESS: Quiz '{new_quiz.title}' saved to Course {c_id}")
        return jsonify({'message': 'Quiz created successfully!', 'quiz_id': new_quiz.id}), 201

    except Exception as e:
        db.session.rollback() 
        print(f"DATABASE ERROR during quiz creation: {e}")
        return jsonify({'error': 'Database failure. Check server logs.'}), 500
    
# 2. GET QUIZ (Student - Start Exam)
@quiz_bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz: return jsonify({'error': 'Not found'}), 404

    if not quiz.is_published:
        return jsonify({'error': 'This quiz has not been assigned yet.'}), 403

    # Check if already attempted
    user_id = int(get_jwt_identity())
    existing = QuizSubmission.query.filter_by(quiz_id=quiz_id, student_id=user_id).first()
    if existing:
        return jsonify({'error': 'You have already attempted this quiz.'}), 400

    questions = []
    for q in quiz.questions:
        questions.append({
            'id': q.id,
            'text': q.text,
            'options': {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}
        })

    return jsonify({
        'quiz': {
            'id': quiz.id,
            'title': quiz.title,
            'time_limit': quiz.time_limit_minutes,
            'deadline': quiz.deadline.isoformat() if quiz.deadline else None,
            'questions': questions
        }
    }), 200

@quiz_bp.route('/course/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_quizzes(course_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if user.role == 'teacher':
        quizzes = Quiz.query.filter_by(course_id=course_id).all()
    else:
        quizzes = Quiz.query.filter_by(course_id=course_id, is_published=True).all()
        
    output = []
    for q in quizzes:
        # Check if this specific student has submitted this quiz
        submission = None
        if user.role != 'teacher':
            submission = QuizSubmission.query.filter_by(
                quiz_id=q.id, 
                student_id=user_id
            ).first()

        output.append({
            'id': q.id,
            'title': q.title,
            'time_limit': q.time_limit_minutes,
            'is_published': q.is_published,
            'deadline': q.deadline.isoformat() if q.deadline else None,
            'attempted': bool(submission),
            'score': submission.score if submission else None  # 👈 This feeds React the score!
        })
        
    return jsonify({'quizzes': output}), 200

@quiz_bp.route('/student/available-quizzes/<int:course_id>', methods=['GET'])
@jwt_required()
def get_student_available_quizzes(course_id):
    try:
        identity = get_jwt_identity()
        user_id = identity['id'] if isinstance(identity, dict) else int(identity)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid token structure'}), 401
    
    print(f"DEBUG: Student {user_id} checking for quizzes in Course ID: {course_id}")
    
    # Fetch quizzes that are published AND belong to this course
    quizzes = Quiz.query.filter_by(course_id=course_id, is_published=True).all()
    
    available_quizzes = []
    for q in quizzes:
        # Check if the student has already submitted an attempt for this quiz
        existing_submission = QuizSubmission.query.filter_by(
            quiz_id=q.id, 
            student_id=user_id
        ).first()
        
        # Only add to list if they haven't attempted it yet
        if not existing_submission:
            available_quizzes.append({
                "id": q.id,
                "title": q.title,
                "time_limit": q.time_limit_minutes,
                "deadline": q.deadline.isoformat() if q.deadline else None
            })
    
    print(f"DEBUG: Found {len(available_quizzes)} unattempted published quizzes")
    return jsonify(available_quizzes), 200

@quiz_bp.route('/<int:quiz_id>/assign', methods=['POST'])
@jwt_required()
def assign_existing_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user.role != 'teacher': return jsonify({'error': 'Unauthorized'}), 403

    quiz = Quiz.query.get_or_404(quiz_id)
    target_course = Course.query.get(quiz.course_id)
    if not target_course or target_course.teacher_id != user_id:
        return jsonify({'error': 'Unauthorized course modifications parameters.'}), 403
    data = request.get_json()
    
    quiz.is_published = True
    if data.get('deadline'):
        quiz.deadline = datetime.fromisoformat(data.get('deadline'))
    
    db.session.commit()
    return jsonify({'message': 'Quiz assigned to students!'}), 200

# 3. SUBMIT QUIZ
@quiz_bp.route('/submit', methods=['POST'])
@jwt_required()
def submit_quiz():
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid token structure'}), 401

    data = request.get_json()
    quiz_id = data.get('quiz_id')
    answers = data.get('answers', {}) 

    quiz = Quiz.query.get(quiz_id)
    if not quiz: 
        return jsonify({'error': 'Quiz not found'}), 404

    if quiz.deadline and datetime.utcnow() > quiz.deadline:
        return jsonify({'error': 'Submission blocked. The quiz deadline has passed.'}), 400

    from app.models.models import Enrollment
    is_enrolled = Enrollment.query.filter_by(student_id=user_id, course_id=quiz.course_id).first()
    if not is_enrolled:
        return jsonify({'error': 'Unauthorized. You are not enrolled in the course associated with this quiz.'}), 403

    # Prevent double submissions
    existing = QuizSubmission.query.filter_by(quiz_id=quiz_id, student_id=user_id).first()
    if existing:
        return jsonify({'error': 'You have already attempted this quiz.'}), 400

    score = 0
    total = len(quiz.questions)
    for q in quiz.questions:
        if answers.get(str(q.id)) == q.correct_option:
            score += 1
    
    final_score = (score / total) * 100 if total > 0 else 0
    submission = QuizSubmission(quiz_id=quiz_id, student_id=user_id, score=final_score, total_questions=total)
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({'message': 'Submitted successfully', 'score': final_score, 'correct': score, 'total': total}), 200

# 4. GET QUIZ RESULTS
@quiz_bp.route('/<int:quiz_id>/results', methods=['GET'])
@jwt_required()
def get_quiz_results(quiz_id):
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid token structure'}), 401

    quiz = Quiz.query.get_or_404(quiz_id)
    course = Course.query.get(quiz.course_id)
    
    if not course or course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You are not the instructor for this course.'}), 403

    submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
    results = []
    for sub in submissions:
        student = User.query.get(sub.student_id)
        results.append({
            'student_name': student.username if student else 'Unknown',
            'score': sub.score,
            'total': sub.total_questions,
            'date': sub.submitted_at.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify({'quiz_title': quiz.title, 'results': results}), 200

# 5. GET QUIZ ANALYTICS
@quiz_bp.route('/<int:quiz_id>/stats', methods=['GET'])
@jwt_required()
def get_quiz_stats(quiz_id):
    try:
        user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid token structure'}), 401

    quiz = Quiz.query.get_or_404(quiz_id)
    course = Course.query.get(quiz.course_id)
    
    if not course or course.teacher_id != user_id:
        return jsonify({'error': 'Access denied. You are not the instructor for this course.'}), 403

    submissions = QuizSubmission.query.filter_by(quiz_id=quiz_id).all()
    
    if not submissions:
        return jsonify({
            'title': quiz.title, 'is_published': quiz.is_published, 'deadline': quiz.deadline.isoformat() if quiz.deadline else None,
            'total_students': 0, 'average_score': 0, 'highest_score': 0, 'student_scores': []
        }), 200

    total_scores = [sub.score for sub in submissions]
    student_data = []
    for sub in submissions:
        student = User.query.get(sub.student_id)
        if student:
            student_data.append({
                'name': student.username, 'email': student.email, 'score': sub.score,
                'submitted_at': sub.submitted_at.strftime('%Y-%m-%d %H:%M')
            })
    student_data.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({
        'title': quiz.title,
        'is_published': quiz.is_published,
        'deadline': quiz.deadline.isoformat() if quiz.deadline else None,
        'total_students': len(submissions),
        'average_score': round(sum(total_scores) / len(total_scores), 1),
        'highest_score': max(total_scores),
        'student_scores': student_data
    }), 200