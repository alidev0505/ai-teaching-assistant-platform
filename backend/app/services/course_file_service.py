import os
import zipfile
import io
from datetime import datetime
from app.models.models import Material, Quiz, QuizSubmission, Assignment, Submission, Attendance, User

class CourseFileService:
    @staticmethod
    def generate_course_zip(course):
        memory_file = io.BytesIO()
        
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            
            # 1. Course Outline
            c_code = getattr(course, 'class_code', getattr(course, 'code', 'N/A'))
            zf.writestr("1_Course_Outline/Course_Outline.txt", 
                        f"Course Name: {course.name}\n"
                        f"Course Code: {c_code}\n"
                        f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # 2. Lectures
            materials = Material.query.filter_by(course_id=course.id).all()
            for mat in materials:
                if mat.file_path and os.path.exists(mat.file_path):
                    zf.write(mat.file_path, f"2_Lectures/{os.path.basename(mat.file_path)}")

            # 3. Quizzes
            quizzes = Quiz.query.filter_by(course_id=course.id).all()
            for q in quizzes:
                # Quiz Questions File
                q_text = f"Quiz: {q.title}\n" + "-"*20 + "\n"
                for i, quest in enumerate(q.questions):
                    # ✅ FIX: Accessing individual option columns
                    oa = getattr(quest, 'option_a', 'N/A')
                    ob = getattr(quest, 'option_b', 'N/A')
                    oc = getattr(quest, 'option_c', 'N/A')
                    od = getattr(quest, 'option_d', 'N/A')
                    
                    q_text += f"Q{i+1}: {quest.text}\nA) {oa}\nB) {ob}\nC) {oc}\nD) {od}\n\n"
                zf.writestr(f"3_Quizzes/Quiz_Question/{q.title}_Questions.txt", q_text)
                
                # Quiz Solution File
                s_text = q_text + "\n" + "-"*20 + "\nANSWER KEY:\n"
                for i, quest in enumerate(q.questions):
                    s_text += f"Q{i+1}: {getattr(quest, 'correct_option', 'N/A')}\n"
                zf.writestr(f"3_Quizzes/Quiz_Solution/{q.title}_Solutions.txt", s_text)
                
                # Quiz Grading Performance
                subs = QuizSubmission.query.filter_by(quiz_id=q.id).order_by(QuizSubmission.score.desc()).all()
                if subs:
                    mid = len(subs) // 2
                    best_sid = getattr(subs[0], 'user_id', getattr(subs[0], 'student_id', 'N/A'))
                    worst_sid = getattr(subs[-1], 'user_id', getattr(subs[-1], 'student_id', 'N/A'))
                    
                    stats = f"BEST SCORE: {subs[0].score}% (Student ID: {best_sid})\n"
                    stats += f"AVG SCORE: {subs[mid].score}%\n"
                    stats += f"WORST SCORE: {subs[-1].score}% (Student ID: {worst_sid})\n"
                    zf.writestr(f"3_Quizzes/Quiz_Grading/{q.title}_Stats.txt", stats)

            # 4. Assignments
            assigns = Assignment.query.filter_by(course_id=course.id).all()
            for a in assigns:
                zf.writestr(f"4_Assignments/Assignment_Question/{a.title}_Info.txt", f"Title: {a.title}\nTask: {a.description or ''}")
                zf.writestr(f"4_Assignments/Assignment_Solution/{a.title}_Solution.txt", str(a.teacher_solution or ''))
                
                asub = Submission.query.filter_by(assignment_id=a.id).order_by(Submission.obtained_marks.desc()).all()
                if asub:
                    high_m = getattr(asub[0], 'obtained_marks', 0)
                    low_m = getattr(asub[-1], 'obtained_marks', 0)
                    zf.writestr(f"4_Assignments/Assignment_Grading/{a.title}_Stats.txt", f"High Marks: {high_m}\nLow Marks: {low_m}")

            # 5. Student Attendance
            attendance_recs = Attendance.query.filter_by(course_id=course.id).all()
            att_report = "Date, Student ID, Status\n"
            for att in attendance_recs:
                sid = getattr(att, 'user_id', getattr(att, 'student_id', 'N/A'))
                status_str = getattr(att, 'status', 'Absent')
                att_report += f"{att.date.isoformat() if hasattr(att.date, 'isoformat') else att.date}, {sid}, {status_str}\n"
            zf.writestr("5_Student_Attendance/Attendance_Summary.csv", att_report)

            # 6. Course Review
            zf.writestr("6_Course_ReviewFile/Review.txt", f"Course: {course.name}\nRecords processed successfully.")

            # 7. Student Result Summary
            zf.writestr("7_Student_FullResult/Result_Sheet.csv", "Student ID, Name, Overall Result\n(Consult Gradebook for details)")

        memory_file.seek(0)
        return memory_file