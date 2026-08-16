import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from app.models.models import db

# Import Blueprints
from app.routes.admin import admin_bp
from app.routes.notifications import notify_bp
from app.routes.quiz_routes import quiz_bp
from app.routes.auth import auth_bp
from app.routes.upload import upload_bp
from app.routes.content import content_bp
from app.routes.dashboard import dashboard_bp
from app.routes.student import student_bp 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={
        r"/*": {
            "origins": [
                "https://ai-teaching-assistant-platform.vercel.app",
                "http://localhost:5173", 
                "http://127.0.0.1:5173",        
                "http://localhost:5000",        
                "http://127.0.0.1:5000",        
                "https://ai-teaching-assistant-ecru.vercel.app"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "Bypass-Tunnel-Reminder"],
            "expose_headers": ["Content-Type", "Authorization"]
        }
    }, supports_credentials=True)

    # Initialize Extensions
    JWTManager(app)
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(content_bp, url_prefix='/api/content')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notify_bp, url_prefix='/api/notifications')
    app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    with app.app_context():
        print("🚀 Booting up: App Context created.")
        
        # TEMPORARILY COMMENTED OUT TO FIND THE 504 TIMEOUT
        # try:
        #     db.create_all()
        # except Exception as e:
        #     print(f"⚠️ Database initialization notice: {e}")

        # try:
        #     from app.services.scheduler_service import SchedulerService
        #     background_worker = SchedulerService(app)
        #     background_worker.start()
        # except Exception as e:
        #     print(f"⚠️ Non-critical scheduler worker runtime start failure: {e}")
        
        print("✅ Finished Boot Sequence smoothly!")

    return app