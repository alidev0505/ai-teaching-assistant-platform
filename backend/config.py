import os
from datetime import timedelta

class Config:
    # Set up absolute path directories cleanly
    BACKEND_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # FOLDER PATHS 
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    GENERATED_FOLDER = os.path.join(os.getcwd(), 'generated')
    VECTOR_DB_PATH = os.path.join(os.getcwd(), 'vector_db')

    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    
    # Set token expiry limit window safely
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4) # Lowered to 4 hours to limit exposure windows
    
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024 
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

    FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://ai-teaching-assistant-platform.vercel.app')