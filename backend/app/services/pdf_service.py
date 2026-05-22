import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os

class PDFService:
    @staticmethod
    def extract_text_from_pdf(pdf_path):
        """
        Extract text from PDF using PyMuPDF safely with structural and volume safety boundaries.
        Falls back to OCR if text extraction fails.
        """
        try:
            doc = fitz.open(pdf_path)
            
            if len(doc) > 100:  # Restrict to a safe 100-page limit per document for student processing
                doc.close()
                print("⚠️ Security Exception: Document exceeds maximum allowable page threshold volumes.")
                return None

            text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                page_text = page.get_text()
                
                if not page_text.strip():
                    page_text = PDFService._ocr_page(page)
                
                if len(text) > 1000000:  # 1 Million characters cap maximum threshold 
                    print("⚠️ Content generation truncated due to structural document safety thresholds.")
                    break

                text += f"\n--- Page {page_num + 1} ---\n"
                text += page_text
            
            doc.close()
            return text
        
        except Exception as e:
            print(f"Error executing file reading extraction processes safely.")
            return None
    
    @staticmethod
    def _ocr_page(page):
        """
        Perform OCR on a PDF page securely checking wrapper binary states gracefully.
        """
        try:
            # Render page to image with reasonable matrix multiplier bounds
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.open(io.BytesIO(pix.tobytes()))
            
            try:
                text = pytesseract.image_to_string(img)
                return text
            except FileNotFoundError:
                print("⚠️ OCR Engine Bypass: pytesseract command dependency binary missing on hosting node.")
                return "[OCR Error: Document contains scanned images but text extraction tools are unavailable.]"
        
        except Exception:
            return ""
    
    @staticmethod
    def chunk_text(text, chunk_size=1000, overlap=200):
        """
        Split text into overlapping chunks for better RAG performance.
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (chunk_size - overlap)
        
        return chunks