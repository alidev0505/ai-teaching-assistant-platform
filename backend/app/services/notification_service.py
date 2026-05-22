import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

class NotificationService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = os.getenv('SMTP_EMAIL')
        self.sender_password = os.getenv('SMTP_PASSWORD')
    
    def send_email(self, to_email, subject, body):
        """
        Send email notification using Gmail SMTP
        """
        if not self.sender_email or not self.sender_password:
            print("SMTP credentials not configured")
            return False
        
        try:
            message = MIMEMultipart()
            message['From'] = self.sender_email
            message['To'] = to_email
            message['Subject'] = subject
            
            message.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=5)
            server.ehlo() # Secure communication handshake
            server.starttls()
            server.ehlo()
            
            server.login(self.sender_email, self.sender_password)
            
            text = message.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            
            print(f"Email sent successfully to safe destination parameters")
            return True
        
        except Exception as e:
            print(f"SMTP execution failure handled safely.")
            return False
    
    def send_assignment_notification(self, student_email, assignment_title, deadline):
        subject = f"New Assignment: {assignment_title}"
        body = f"""
        <html>
            <body>
                <h2>New Assignment Posted</h2>
                <p>You have a new assignment: <strong>{assignment_title}</strong></p>
                <p>Deadline: <strong>{deadline}</strong></p>
                <p>Please login to your dashboard to view details.</p>
            </body>
        </html>
        """
        return self.send_email(student_email, subject, body)
    
    def send_deadline_reminder(self, student_email, assignment_title, hours_left):
        subject = f"Reminder: Assignment Due Soon - {assignment_title}"
        body = f"""
        <html>
            <body>
                <h2>Assignment Deadline Reminder</h2>
                <p>Your assignment <strong>{assignment_title}</strong> is due in {hours_left} hours!</p>
                <p>Please submit before the deadline.</p>
            </body>
        </html>
        """
        return self.send_email(student_email, subject, body)