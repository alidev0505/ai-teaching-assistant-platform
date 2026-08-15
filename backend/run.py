import os
import sys
from dotenv import load_dotenv
load_dotenv()

# Suppress deep library diagnostic logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'



from app import create_app

app = create_app()

uploads_dir = app.config.get('UPLOAD_FOLDER')
generated_dir = app.config.get('GENERATED_FOLDER')
vector_dir = app.config.get('VECTOR_DB_PATH')

if uploads_dir: os.makedirs(uploads_dir, exist_ok=True)
if generated_dir: os.makedirs(generated_dir, exist_ok=True)
if vector_dir: os.makedirs(vector_dir, exist_ok=True)

if __name__ == '__main__':
    is_debug = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1']
    
    # Port assignment naturally shifts cleanly behind Gunicorn on Azure hosting environments
    # 👇 Changed from 5000 to 5001
    app.run(debug=is_debug, port=5005, use_reloader=False)