import os
import PyPDF2
import docx
import pytesseract
from pdf2image import convert_from_path
from PIL import Image


def extract_text_from_file(file_path):
    """
    Reads a file (PDF, DOCX, TXT) and returns its text content.
    Automatically handles scanned PDFs via OCR fallback.
    """
    if not os.path.exists(file_path):
        return ""

    ext = file_path.rsplit('.', 1)[1].lower()
    text = ""

    try:
        if ext == 'pdf':
            # 1. Try standard extraction first (fast)
            text = _extract_from_standard_pdf(file_path)
            
            # 2. If text is empty or very short, assume it's a scanned image -> Run OCR
            if not text or len(text.strip()) < 50: 
                print(f"⚠️ PDF ({file_path}) seems scanned or empty. Attempting OCR...")
                text = _extract_from_scanned_pdf(file_path)

        elif ext == 'docx':
            text = _extract_from_docx(file_path)
            
        elif ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        return ""

    return text.strip()


def _extract_from_standard_pdf(file_path):
    """Fast extraction for digital PDFs using PyPDF2 with safety boundaries."""
    text = ""
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            if len(reader.pages) > 100:
                print("⚠️ Security Restriction: Exceeded maximum text extraction limit context bounds.")
                return ""
                
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
                    # Prevent text memory buffer starvation
                    if len(text) > 500000:
                        break
    except Exception as e:
        print(f"Standard PDF Error: {e}")
    return text

def _extract_from_scanned_pdf(file_path):
    """
    Slow but memory-isolated OCR extraction for images/scanned PDFs.
    """
    text = ""
    try:
        images = convert_from_path(file_path, first_page=1, last_page=15)

        for image in images:
            try:
                page_text = pytesseract.image_to_string(image)
                text += page_text + "\n"
            except FileNotFoundError:
                text += "\n[System Notice: OCR Command Dependency Binary Missing on Hosting Environment.]\n"
                break
            finally:
                # Explicitly free memory allocations for image streams
                if hasattr(image, 'close'):
                    image.close()
            
    except Exception as e:
        print(f"OCR Error handled safely.")
        
    return text

def _extract_from_docx(file_path):
    """Extract text from DOCX files using explicit resource wrapper tracking."""
    try:
        with open(file_path, 'rb') as f:
            doc = docx.Document(f)
            return "\n".join([para.text for para in doc.paragraphs if para and para.text])
    except Exception as e:
        print(f"DOCX Error isolated.")
        return ""