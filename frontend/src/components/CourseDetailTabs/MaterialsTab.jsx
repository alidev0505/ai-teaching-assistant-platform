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

    {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
    <style>{`
      .mt-main-wrapper {
        width: 100%;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: mt-fadeIn 0.2s ease-out;
      }

      /* Teacher Upload Header Card */
      .mt-upload-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.01);
        box-sizing: border-box;
      }

      .mt-upload-title {
        margin: 0 0 16px 0;
        font-size: 1.05rem;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -0.02em;
      }

      .mt-upload-form {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
      }

      .mt-text-input {
        flex: 2;
        min-width: 240px;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.925rem;
        font-family: inherit;
        color: #0f172a;
        outline: none;
        box-sizing: border-box;
        height: 42px;
        transition: border-color 0.15s, box-shadow 0.15s;
      }

      .mt-text-input:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }

      .mt-file-input-wrapper {
        flex: 1.2;
        min-width: 200px;
        box-sizing: border-box;
      }

      .mt-file-raw-input {
        font-size: 0.85rem;
        color: #475569;
        width: 100%;
      }

      .mt-btn-upload-submit {
        background-color: #4f46e5;
        color: #ffffff;
        border: none;
        padding: 0 20px;
        height: 42px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
        transition: background-color 0.15s, transform 0.1s;
        white-space: nowrap;
        box-sizing: border-box;
      }

      .mt-btn-upload-submit:hover:not(:disabled) {
        background-color: #4338ca;
      }

      .mt-btn-upload-submit:active:not(:disabled) {
        transform: scale(0.98);
      }

      .mt-btn-upload-submit:disabled {
        background-color: #cbd5e1;
        color: #94a3b8;
        cursor: not-allowed;
        box-shadow: none;
      }

      /* Grid Repository Deck Layout */
      .mt-grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
        gap: 16px;
        width: 100%;
        box-sizing: border-box;
      }

      .mt-document-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 4px rgb(0 0 0 / 0.01);
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .mt-document-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
      }

      .mt-card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .mt-document-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .mt-btn-card-delete {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.95rem;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background-color 0.15s;
        line-height: 1;
      }

      .mt-btn-card-delete:hover {
        background-color: #fef2f2;
      }

      .mt-card-action-row {
        display: flex;
        gap: 10px;
        margin-top: auto;
      }

      .mt-btn-action-download, .mt-link-action-generate, .mt-btn-action-processing-disabled {
        flex: 1;
        padding: 10px 14px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.825rem;
        text-align: center;
        text-decoration: none;
        box-sizing: border-box;
        font-family: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mt-btn-action-download {
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s;
      }

      .mt-btn-action-download:hover {
        background-color: #e2e8f0;
        color: #0f172a;
        border-color: #94a3b8;
      }

      .mt-link-action-generate {
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #2563eb;
        transition: all 0.15s;
      }

      .mt-link-action-generate:hover {
        background-color: #2563eb;
        color: #ffffff;
        border-color: #2563eb;
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
      }

      .mt-btn-action-processing-disabled {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #94a3b8;
        cursor: not-allowed;
      }

      /* Empty State Dashboard */
      .mt-empty-repository-card {
        padding: 60px 24px;
        background-color: #ffffff;
        border: 2px dashed #cbd5e1;
        border-radius: 12px;
        text-align: center;
        box-sizing: border-box;
        max-width: 500px;
        width: 100%;
        margin: 20px auto 0;
      }

      .mt-empty-art {
        font-size: 3rem;
        margin-bottom: 12px;
        opacity: 0.4;
        line-height: 1;
      }

      .mt-empty-text-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
      }

      .mt-empty-text-subtitle {
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0;
        font-weight: 500;
      }

      @keyframes mt-fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Tablet/Smartphone Media Adapters */
      @media (max-width: 768px) {
        .mt-upload-form {
          flex-direction: column;
          align-items: stretch;
        }
        .mt-text-input, .mt-file-input-wrapper, .mt-btn-upload-submit {
          width: 100%;
        }
        .mt-file-raw-input {
          padding: 4px 0;
        }
      }
    `}</style>
  </div>
);

export default MaterialsTab;