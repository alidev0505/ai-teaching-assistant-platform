import os
import pickle
import numpy as np
import faiss
from config import Config
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

class RAGService:
    _model = None  # class-level cache so model is loaded only once

    def __init__(self):
        # Do NOT load the model here — use lazy property below
        self.vector_db_path = getattr(Config, 'VECTOR_DB_PATH', os.path.join(os.getcwd(), 'vector_db'))
        self.index = None
        self.chunks = []
        self.material_id = None

        # Ensure vector_db directory exists
        os.makedirs(self.vector_db_path, exist_ok=True)

    @property
    def embedding_model(self):
        """Lazy-load the embedding model the first time it is actually needed."""
        if RAGService._model is None:
            print("🔄 Loading embedding model (first use)...")
            from sentence_transformers import SentenceTransformer
            RAGService._model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            print("✅ Embedding model loaded.")
        return RAGService._model

    def process_document(self, file_path, material_id):
        """
        Reads a PDF, splits it into chunks, and saves it to the FAISS Vector Database.
        This fixes the 'AttributeError: process_document'
        """
        try:
            print(f"📄 Processing PDF: {file_path}")
            
            # 1. Load PDF
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # 2. Split Text
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            split_docs = text_splitter.split_documents(documents)
            
            # Extract just the text content for embedding
            text_chunks = [doc.page_content for doc in split_docs]
            
            if not text_chunks:
                print("⚠️ Warning: No text extracted from PDF.")
                return False

            # 3. Create Embeddings & Save Index
            return self.create_embeddings(text_chunks, material_id)

        except Exception as e:
            print(f"❌ RAG Processing Error: {str(e)}")
            raise e
    
    def create_embeddings(self, text_chunks, material_id):
        """
        Create embeddings for text chunks and store in FAISS.
        """
        self.material_id = material_id
        self.chunks = text_chunks
        
        print(f"🔢 Generating embeddings for {len(text_chunks)} chunks...")
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(text_chunks, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        
        # Save index and chunks
        self._save_index(material_id)
        
        print(f"✅ Index saved for Material ID: {material_id}")
        return True
    
    def retrieve(self, query, top_k=5):
        """
        Retrieve top-k most relevant chunks for a query.
        """
        if self.index is None:
            return []
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search in FAISS
        distances, indices = self.index.search(query_embedding, top_k)
        
        # Return relevant chunks
        results = []
        for idx in indices[0]:
            if idx < len(self.chunks) and idx != -1:
                results.append(self.chunks[idx])
        
        return results
    
    def load_index(self, material_id):
        """
        Load existing FAISS index and plain text chunks securely without deserialization vulnerabilities.
        """
        
        try:
            safe_id = int(material_id)
        except (ValueError, TypeError):
            print("❌ Security Exception: Malformed material identifier token.")
            return False

        index_path = os.path.join(self.vector_db_path, f'index_{safe_id}.faiss')
        chunks_path = os.path.join(self.vector_db_path, f'chunks_{safe_id}.json') # Swapped to safe JSON tracking files
        
        if not os.path.exists(index_path) or not os.path.exists(chunks_path):
            print(f"⚠️ Index not found at: {index_path}")
            return False
        
        try:
            self.index = faiss.read_index(index_path)
            
            import json
            with open(chunks_path, 'r', encoding='utf-8') as f:
                self.chunks = json.load(f)
            
            self.material_id = safe_id
            return True
        except Exception as e:
            print(f"❌ Error loading index components safely: {e}")
            return False
    
    def _save_index(self, material_id):
        """
        Save FAISS index and text arrays securely to disk using standard JSON.
        """
        try:
            safe_id = int(material_id)
            index_path = os.path.join(self.vector_db_path, f'index_{safe_id}.faiss')
            chunks_path = os.path.join(self.vector_db_path, f'chunks_{safe_id}.json') # Fixed target mapping extension
            
            faiss.write_index(self.index, index_path)
            
            # Safe JSON array writing loop wrapper
            import json
            with open(chunks_path, 'w', encoding='utf-8') as f:
                json.dump(self.chunks, f, ensure_ascii=False)
                
        except Exception as e:
            print(f"❌ Storage layer persistence handling exception: {e}")