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
    <div className="rt-grid-layout">
      {generatedResources.length === 0 ? (
        <div className="rt-empty-state">
          No AI resource items have been generated from lecture assets yet.
        </div>
      ) : (
        generatedResources.map(res => (
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
            
            <h4 className="rt-card-title">{getResourceTitle(res.type)}</h4>
            <p className="rt-card-body-content">{res.content}</p>
            
            <div className="rt-card-footer">
              <span className="rt-timestamp">{res.date || 'Recent Log'}</span>
              <button 
                onClick={() => handleCopyToClipboard(res.content, res.id)} 
                className={`rt-copy-action-btn ${copiedId === res.id ? 'rt-copied-state' : ''}`}
              >
                {copiedId === res.id ? '✓ Copied!' : '📋 Copy Text'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AIResourcesTab;