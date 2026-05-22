from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.models.models import db, Assignment, Submission, Enrollment
from app.services.notification_service import NotificationService

class SchedulerService:
    def __init__(self, app):
        self.app = app
        self.scheduler = BackgroundScheduler()
        self.notification_service = NotificationService()
    
    def start(self):
        # Check for upcoming deadlines every hour
        self.scheduler.add_job(
            func=self.check_deadlines,
            trigger="interval",
            hours=1
        )
        self.scheduler.start()
    
    def check_deadlines(self):
        with self.app.app_context():
            try:
                now = datetime.utcnow()
                target_window_start = now + timedelta(hours=23)
                target_window_end = now + timedelta(hours=24)
                
                assignments = Assignment.query.filter(
                    Assignment.deadline.between(target_window_start, target_window_end)
                ).all()
                
                for assignment in assignments:
                    enrollments = Enrollment.query.filter_by(
                        course_id=assignment.course_id
                    ).all()
                    
                    for enrollment in enrollments:
                        # Skip if student already submitted assignment tasks
                        submission = Submission.query.filter_by(
                            assignment_id=assignment.id,
                            student_id=enrollment.student_id
                        ).first()
                        
                        if not submission:
                            # Verify valid relational target pointers exist safely
                            if not enrollment.student or not enrollment.student.email:
                                continue

                            time_delta = assignment.deadline - now
                            hours_left = max(1, int(time_delta.total_seconds() / 3600))
                            
                            # Transmit targeted dispatcher alert cleanly 
                            self.notification_service.send_deadline_reminder(
                                enrollment.student.email,
                                assignment.title,
                                hours_left
                            )
                            
                # Explicit database connection boundary release back to the transaction pool
                db.session.remove()
                
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Scheduler Thread Safety Fault handled gracefully.")