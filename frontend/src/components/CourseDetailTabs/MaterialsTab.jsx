import React from 'react';
import { Link } from 'react-router-dom';

const MaterialsTab = ({ 
  user, 
  materials = [], 
  uploading, 
  handleMaterialUpload, 
  handleDeleteMaterial, 
  handleDownload 
}) => (
  <div className="mt-main-wrapper">
    
    {/* --- Teacher File Upload Console Panel --- */}
    {user?.role === 'teacher' && (
      <div className="mt-upload-card">
        <h3 className="mt-upload-title">📤 Upload Course Materials</h3>
        <form onSubmit={handleMaterialUpload} className="mt-upload-form">
          <input 
            type="text"
            name="title" 
            placeholder="e.g., Lecture 4: Vector Embeddings" 
            required 
            className="mt-text-input" 
          />
          <div className="mt-file-input-wrapper">
            <input 
              type="file" 
              name="file" 
              accept=".pdf" 
              required 
              className="mt-file-raw-input" 
            />
          </div>
          <button 
            type="submit" 
            className="mt-btn-upload-submit" 
            disabled={uploading}
          >
            {uploading ? 'Processing Layout...' : 'Upload PDF Document'}
          </button>
        </form>
      </div>
    )}

    {/* --- Core Materials Document Repository Deck --- */}
    {materials.length === 0 ? (
      <div className="mt-empty-repository-card">
        <div className="mt-empty-art">📁</div>
        <h4 className="mt-empty-text-title">Repository Empty</h4>
        <p className="mt-empty-text-subtitle">
          No lecture syllabus archives or reference documents have been indexed into this channel workspace yet.
        </p>
      </div>
    ) : (
      <div className="mt-grid-layout">
        {materials.map(m => (
          <div key={m.id} className="mt-document-card">
            <div className="mt-card-header-row">
              <h4 className="mt-document-title">📄 {m.title || "Untitled Lecture Note"}</h4>
              {user?.role === 'teacher' && (
                <button 
                  onClick={() => handleDeleteMaterial(m.id)} 
                  className="mt-btn-card-delete"
                  title="Delete resource"
                >
                  🗑️
                </button>
              )}
            </div>
            
            <div className="mt-card-action-row">
              <button 
                onClick={() => handleDownload(m.file_path, m.title)} 
                className="mt-btn-action-download"
              >
                ⬇ Download
              </button>
              
              {/* ✅ UX OPTIMIZATION: Differentiates raw state queues while documents are running through the pipeline */}
              {user?.role === 'teacher' && (
                m.is_processed ? (
                  <Link to={`/generate/${m.id}`} className="mt-link-action-generate">
                    🤖 AI Generate
                  </Link>
                ) : (
                  <button className="mt-btn-action-processing-disabled" disabled title="The AI model is currently indexing text splits.">
                    ⏳ Indexing...
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default MaterialsTab;