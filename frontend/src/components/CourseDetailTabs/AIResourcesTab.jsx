import React, { useState } from 'react';

const AIResourcesTab = ({ generatedResources = [], handleDeleteResource }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyToClipboard = (content, id) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    
    // Clear micro-interaction states automatically after a short window
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const getResourceTitle = (type) => {
    const titleMap = {
      quiz: '🧩 Generated Quiz Bank',
      assignment: '📝 AI Course Assignment',
      slides: '📊 Automated Slide Deck',
      lecture: '📖 Synthesis Lecture Guide'
    };
    return titleMap[String(type).toLowerCase()] || '⚡ AI Study Resource';
  };

  return (
    <div className="rt-main-wrapper">
      {generatedResources.length === 0 ? (
        <div className="rt-empty-state">
          <div className="rt-empty-icon">🤖</div>
          <h4 className="rt-empty-title">No AI Resources Handled</h4>
          <p className="rt-empty-subtitle">
            No quiz banks, lecture summaries, or assignment questions have been synthesized from your course documents yet.
          </p>
        </div>
      ) : (
        <div className="rt-grid-layout">
          {generatedResources.map(res => (
            <div key={res.id} className="rt-resource-card">
              <div className="rt-card-header">
                <span className={`rt-badge rt-badge-${String(res.type).toLowerCase()}`}>
                  {res.type || 'AI'}
                </span>
                <button 
                  onClick={() => handleDeleteResource(res.id)} 
                  className="rt-delete-btn"
                  title="Remove resource item"
                >
                  🗑️
                </button>
              </div>
              
              <h3 className="rt-card-title">{getResourceTitle(res.type)}</h3>
              <p className="rt-card-body-content">{res.content}</p>
              
              <div className="rt-card-footer">
                <span className="rt-timestamp">📅 {res.date || 'Recent Log'}</span>
                <button 
                  onClick={() => handleCopyToClipboard(res.content, res.id)} 
                  className={`rt-copy-action-btn ${copiedId === res.id ? 'rt-copied-state' : ''}`}
                >
                  {copiedId === res.id ? '✓ Copied!' : '📋 Copy Text'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .rt-main-wrapper {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          animation: rt-fadeIn 0.2s ease-out;
        }

        /* Responsive Dashboard Card Grid Matrix */
        .rt-grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .rt-resource-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 4px rgb(0 0 0 / 0.01);
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .rt-resource-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.04);
        }

        .rt-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        /* Semantic Category Badge Vectors */
        .rt-badge {
          display: inline-block;
          font-size: 0.725rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }

        .rt-badge-quiz { background-color: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
        .rt-badge-assignment { background-color: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .rt-badge-slides { background-color: #fffbeb; color: #d97706; border-color: #fef3c7; }
        .rt-badge-lecture { background-color: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        .rt-delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 4px;
          border-radius: 6px;
          transition: background-color 0.15s;
          line-height: 1;
        }

        .rt-delete-btn:hover {
          background-color: #fef2f2;
        }

        .rt-card-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        /* Body Typography and Line Clamp Bounds */
        .rt-card-body-content {
          margin: 0;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: normal;
          flex-grow: 1;
        }

        /* Footer Alignment & Micro-interaction Copy States */
        .rt-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          margin-top: auto;
          gap: 12px;
        }

        .rt-timestamp {
          font-size: 0.775rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .rt-copy-action-btn {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .rt-copy-action-btn:hover:not(.rt-copied-state) {
          background-color: #e2e8f0;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .rt-copy-action-btn.rt-copied-state {
          background-color: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
          cursor: default;
        }

        /* Empty Tab Layout Fallback Card */
        .rt-empty-state {
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

        .rt-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.4;
          line-height: 1;
        }

        .rt-empty-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .rt-empty-subtitle {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }

        @keyframes rt-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Layout Adjustments */
        @media (max-width: 480px) {
          .rt-resource-card {
            padding: 20px;
          }
          .rt-card-title {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AIResourcesTab;