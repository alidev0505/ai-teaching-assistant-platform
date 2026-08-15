import React, { useState } from 'react';
import jsPDF from 'jspdf';

const AIResourcesTab = ({ generatedResources = [], handleDeleteResource }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const getResourceContent = (res) => {
    if (!res) return '';
    return res.content || res.text || res.body || res.summary || res.description || '';
  };

  const handleCopyToClipboard = async (content, id) => {
    if (!content) {
      console.warn("Nothing to copy: 'content' is empty or undefined.");
      return;
    }

    const textToCopy = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Fallback copy command was unsuccessful');
        }
      }

      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);

    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // 📄 1. Export as PDF
  const handleDownloadPDF = (title, content) => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const cleanTitle = title || 'AI Generated Resource';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(cleanTitle, 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Split long body content into multiple wrapped lines for A4 page width
    const lines = doc.splitTextToSize(content || 'No content provided.', 180);
    doc.text(lines, 15, 30);

    const safeFilename = cleanTitle.toLowerCase().replace(/[^a-z0-0]/gi, '_');
    doc.save(`${safeFilename}.pdf`);
    setActiveMenuId(null);
  };

  // 📝 2. Export as Word (.docx)
  const handleDownloadWord = (title, content) => {
    const cleanTitle = title || 'AI Generated Resource';
    
    // Construct valid HTML structure that MS Word parses directly
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${cleanTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; line-height: 1.6; }
          h1 { color: #0f172a; font-size: 20pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          p { font-size: 11pt; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${cleanTitle}</h1>
        <p>${(content || 'No content provided.').replace(/\n/g, '<br/>')}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFilename = cleanTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    
    link.href = url;
    link.download = `${safeFilename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setActiveMenuId(null);
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
          {generatedResources.filter(Boolean).map((res, index) => {
            const resourceId = res.id || index;
            const resourceType = res.type ? String(res.type).toLowerCase() : 'ai';
            const resourceContent = getResourceContent(res);
            const cardTitle = res.material_title || getResourceTitle(res.type);

            return (
              <div key={resourceId} className="rt-resource-card">
                <div className="rt-card-header">
                  <span className={`rt-badge rt-badge-${resourceType}`}>
                    {res.type || 'AI'}
                  </span>
                  {handleDeleteResource && (
                    <button 
                      onClick={() => handleDeleteResource(resourceId)} 
                      className="rt-delete-btn"
                      title="Remove resource item"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                
                <h3 className="rt-card-title">{cardTitle}</h3>
                
                <p className="rt-card-body-content">{resourceContent || 'No content available.'}</p>
                
                <div className="rt-card-footer">
                  <span className="rt-timestamp">📅 {res.created_at || res.date || 'Recent Log'}</span>
                  
                  <div className="rt-action-buttons">
                    <button 
                      onClick={() => handleCopyToClipboard(resourceContent, resourceId)} 
                      className={`rt-copy-action-btn ${copiedId === resourceId ? 'rt-copied-state' : ''}`}
                    >
                      {copiedId === resourceId ? '✓ Copied!' : '📋 Copy'}
                    </button>

                    {/* Download Dropdown Container */}
                    <div className="rt-download-wrapper">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === resourceId ? null : resourceId)}
                        className="rt-download-trigger-btn"
                        title="Download options"
                      >
                        📥 Download ▾
                      </button>

                      {activeMenuId === resourceId && (
                        <div className="rt-download-menu">
                          <button 
                            onClick={() => handleDownloadPDF(cardTitle, resourceContent)}
                            className="rt-menu-item"
                          >
                            📄 Save as PDF
                          </button>
                          <button 
                            onClick={() => handleDownloadWord(cardTitle, resourceContent)}
                            className="rt-menu-item"
                          >
                            📝 Save as Word (.doc)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── COMPONENT STYLES ── */}
      <style>{`
        .rt-main-wrapper {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          animation: rt-fadeIn 0.2s ease-out;
        }

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
          word-break: break-word;
        }

        .rt-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
          margin-top: auto;
          gap: 8px;
        }

        .rt-timestamp {
          font-size: 0.775rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .rt-action-buttons {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .rt-copy-action-btn, .rt-download-trigger-btn {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.775rem;
          font-weight: 700;
          font-family: inherit;
          transition: all 0.15s ease;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          white-space: nowrap;
          cursor: pointer;
        }

        .rt-copy-action-btn:hover:not(.rt-copied-state), .rt-download-trigger-btn:hover {
          background-color: #e2e8f0;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .rt-copy-action-btn.rt-copied-state {
          background-color: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .rt-download-wrapper {
          position: relative;
        }

        .rt-download-menu {
          position: absolute;
          bottom: 100%;
          right: 0;
          margin-bottom: 6px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          min-width: 160px;
          z-index: 10;
          overflow: hidden;
        }

        .rt-menu-item {
          background: transparent;
          border: none;
          padding: 10px 14px;
          text-align: left;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: background-color 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rt-menu-item:hover {
          background-color: #f8fafc;
          color: #0f172a;
        }

        .rt-menu-item:not(:last-child) {
          border-bottom: 1px solid #f1f5f9;
        }

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