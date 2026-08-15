import os
import requests
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Safely import DDGS supporting both old and new package structures
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

class AssessmentService:
    
    AI_DETECTION_PROVIDER = 'HUGGINGFACE' 
    
    # Best Free Model on Hugging Face (RoBERTa Large)
    HF_MODEL_URL = "https://api-inference.huggingface.co/models/openai-community/roberta-large-openai-detector"
    
    # Load SBERT model once (Best balance of speed/accuracy for local CPU)
    comparison_model = SentenceTransformer('all-MiniLM-L6-v2')

    @staticmethod
    def assess_submission(student_text, teacher_solution, other_student_texts=[]):
        """
        MASTER PIPELINE:
        1. AI Detection (Modular - Free vs Paid)
        2. Plagiarism (Internal + External)
        3. Grading (Semantic Analysis)
        """
        
        results = {
            "status": "PASS",
            "grade": "F",
            "marks": 0,
            "ai_score": 0.0,
            "plagiarism_score": 0.0,
            "accuracy_score": 0.0,
            "feedback": []
        }

        # --- STEP 1: AI DETECTION ---
        ai_score = AssessmentService.check_ai_generated(student_text)
        results['ai_score'] = round(ai_score * 100, 1)
        
        if ai_score > 0.70: # Strict Threshold (70%)
            results['feedback'].append(f"⚠️ High likelihood of AI generation ({results['ai_score']}%).")

        # --- STEP 2: PLAGIARISM CHECK ---
        # A. Internal (Peer-to-Peer)
        peer_plag = AssessmentService.check_internal_plagiarism(student_text, other_student_texts)
        
        # B. External (Web Search)
        web_plag = AssessmentService.check_external_plagiarism(student_text)
        
        # Take the maximum of both risks
        final_plag = max(peer_plag, web_plag)
        results['plagiarism_score'] = round(final_plag * 100, 1)

        if final_plag > 0.40:
            results['feedback'].append(f"⚠️ High Similarity detected ({results['plagiarism_score']}%) - Possible Copying.")

        # --- STEP 3: GRADING ENGINE (Semantic Analysis) ---
        accuracy = AssessmentService.compare_with_teacher(student_text, teacher_solution)
        results['accuracy_score'] = round(accuracy * 100, 1)

        # --- STEP 4: CALCULATE FINAL MARKS ---
        final_marks = accuracy * 100

        # Penalties
        if final_plag > 0.50: 
            final_marks *= 0.5  # 50% penalty for plagiarism
            results['feedback'].append("Penalty applied for plagiarism.")
        
        if ai_score > 0.80:
            final_marks *= 0.8  # 20% penalty for blatant AI usage
            results['feedback'].append("Penalty applied for AI usage.")

        # Cap and Floor
        final_marks = max(0, min(100, int(final_marks)))
        
        results['marks'] = final_marks
        results['grade'] = AssessmentService.calculate_grade(final_marks)
        
        if not results['feedback']:
            results['feedback'].append("✅ Submission accepted.")

        return results

    # ---------------------------------------------------------
    #  AI DETECTION ENGINE (MODULAR)
    # ---------------------------------------------------------

    @staticmethod
    def check_ai_generated(text):
        """
        Router function to choose the AI detection provider.
        """
        if AssessmentService.AI_DETECTION_PROVIDER == 'HUGGINGFACE':
            return AssessmentService._check_huggingface_free(text)
        
        elif AssessmentService.AI_DETECTION_PROVIDER == 'GPTZERO':
            return AssessmentService._check_gptzero_paid(text)
            
        return 0.0

    @staticmethod
    def _check_huggingface_free(text):
        """
        FREE: Uses 'RoBERTa Large' via Hugging Face Inference API with fallback timeout protection.
        """
        token = os.getenv('HF_API_TOKEN')
        if not token:
            print("⚠️ HF_API_TOKEN missing.")
            return 0.0

        headers = {"Authorization": f"Bearer {token}"}
        payload = {"inputs": text[:1500]} 

        try:
            # Added timeout=5 to prevent thread hanging on offline DNS errors
            response = requests.post(AssessmentService.HF_MODEL_URL, headers=headers, json=payload, timeout=5)
            data = response.json()
            
            # Error Handling (Model Loading)
            if isinstance(data, dict) and "error" in data:
                print(f"⚠️ HF API Error: {data['error']}")
                return 0.0

            # Parse [[{'label': 'Real', 'score': 0.1}, {'label': 'Fake', 'score': 0.9}]]
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                for item in data[0]:
                    if item['label'] == 'Fake':
                        return item['score'] 
            return 0.0
        except Exception as e:
            print(f"ℹ️ AI Check Bypassed (Network/Timeout Error): {e}")
            return 0.0

    @staticmethod
    def _check_gptzero_paid(text):
        print("⚠️ Paid Module Not Configured Yet")
        return 0.0

    @staticmethod
    def check_internal_plagiarism(current_text, other_texts):
        """Checks similarity against other students using TF-IDF with length clipping."""
        if not other_texts: return 0.0
        
        try:
            safe_current = current_text[:8000]
            safe_others = [str(t)[:8000] for t in other_texts if t]
            
            documents = [safe_current] + safe_others
            tfidf_vectorizer = TfidfVectorizer().fit_transform(documents)
            cosine_matrix = cosine_similarity(tfidf_vectorizer[0:1], tfidf_vectorizer)
            
            similarities = cosine_matrix[0][1:]
            if len(similarities) > 0:
                return float(max(similarities))
            return 0.0
        except Exception:
            return 0.0

    @staticmethod
    def check_external_plagiarism(text):
        """
        Checks text chunk against web engines safely, avoiding runtime IP bans or timeout blocks.
        """
        try:
            words = text.split()
            if len(words) < 20: return 0.0
            
            start_idx = len(words) // 3
            chunk = " ".join(words[start_idx : start_idx + 20]).strip()
            
            with DDGS(timeout=5) as ddgs:
                results = list(ddgs.text(f'"{chunk}"', max_results=1))
                if results:
                    return 1.0 
            return 0.0
        except Exception as e:
            print(f"ℹ️ Web lookup bypassed safely: {e}")
            return 0.0

    @staticmethod
    def compare_with_teacher(student_text, teacher_text):
        """
        Semantically compares student answer vs teacher key with size-bound boundaries.
        """
        try:
            if not student_text or not teacher_text:
                return 0.0
                
            safe_student = student_text[:5000]
            safe_teacher = teacher_text[:5000]
            
            embeddings = AssessmentService.comparison_model.encode([safe_student, safe_teacher])
            a = embeddings[0]
            b = embeddings[1]
            
            score = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
            return float(score)
        except Exception as e:
            print(f"Grading Error: {e}")
            return 0.0

    @staticmethod
    def calculate_grade(marks):
        if marks >= 90: return 'A+'
        if marks >= 80: return 'A'
        if marks >= 70: return 'B'
        if marks >= 60: return 'C'
        if marks >= 50: return 'D'
        return 'F'