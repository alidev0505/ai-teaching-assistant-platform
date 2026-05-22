import React, { useState, useContext, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateContent, downloadContent } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OPTIONS = [
  { id: 'quiz', detailed: 'mcq', label: 'Quiz (MCQs)', icon: '🧩', color: '#2563eb', bg: '#eff6ff' },
  { id: 'quiz', detailed: 'qa', label: 'Quiz (Q&A)', icon: '💬', color: '#0891b2', bg: '#ecfeff' },
  { id: 'assignment', label: 'Assignment', icon: '📝', color: '#059669', bg: '#f0fdf4' },
  { id: 'midterm', label: 'Mid-Term', icon: '📋', color: '#d97706', bg: '#fffbeb' },
  { id: 'final', label: 'Final Exam', icon: '🎓', color: '#dc2626', bg: '#fef2f2' },
  { id: 'lecture', label: 'Lecture Script', icon: '📖', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'slides', label: 'Slides', icon: '🖼️', color: '#0284c7', bg: '#e0f2fe' },
];

const SUGGESTIONS = [
  'Make questions more challenging',
  'Focus on chapter definitions',
  'Add true/false questions',
  'Include case study questions',
];

const GenerateContent = () => {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const chatBoxRef = useRef(null);

  const [contentType, setContentType] = useState('quiz');
  const [detailedType, setDetailedType] = useState('mcq');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const handleGenerate = async () => {
    setSystemAlert({ type: '', text: '' });
    let history = [...chatHistory];
    
    if (customPrompt.trim()) {
      history.push({ role: 'user', content: customPrompt });
      setCustomPrompt('');
    } else if (history.length === 0) {
      const label = OPTIONS.find(o => o.id === contentType && (o.detailed ? o.detailed === detailedType : true))?.label || contentType;
      history.push({ role: 'user', content: `Generate ${label} content from this lecture.` });
    }
    
    setChatHistory(history);
    setLoading(true);
    setSidebarOpen(false); 
    
    try {
      const res = await generateContent({ material_id: materialId, type: contentType, detailed_type: detailedType, chat_history: history });
      setGeneratedData(res?.data || null);
      setChatHistory([...history, { role: 'ai', content: res?.data?.content || res?.data?.preview }]);
    } catch (err) {
      console.error(err);
      setSystemAlert({ type: 'error', text: 'Generation Failure: Unable to process RAG pipeline request strings.' });
    } finally { 
      setLoading(false); 
    }
  };

  const handlePushToInteractiveQuiz = () => {
    if (!generatedData) return;
    const targetCourseId = generatedData.course_id || materialId; 
    navigate(`/course/${targetCourseId}/create-quiz`, { 
      state: { 
        aiGeneratedContent: generatedData.content,
        title: `Quiz for Lecture Material #${materialId}`
      } 
    });
  };

  const handleDownload = async (format, includeSolutions) => {
    if (!generatedData) return;
    setSystemAlert({ type: '', text: '' });
    
    try {
      const res = await downloadContent(generatedData.content_id, format, includeSolutions);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contentType}_${includeSolutions ? 'SolutionKey' : 'StudentCopy'}.${format}`);
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
    } catch (err) { 
      console.error(err); 
      setSystemAlert({ type: 'error', text: 'Export Disruption: Failed to download document asset formatting compilation.' });
    }
  };

  const selectedOption = OPTIONS.find(o => o.id === contentType && (o.detailed ? o.detailed === detailedType : true));
  const accent = selectedOption?.color || '#2563eb';
  const accentBg = selectedOption?.bg || '#eff6ff';

  return (
    <div className="gc-page-wrapper">
      
      {/* ── TOP NAVIGATION BAR CONSOLE ── */}
      <nav className="gc-top-bar">
        <div className="gc-hero-mesh-overlay" />
        <div className="gc-top-bar-container">
          <div className="gc-top-bar-left">
            <button onClick={() => navigate(-1)} className="gc-btn-back">←</button>
            <div className="gc-logo-area">
              <div className="gc-logo-icon">🎓</div>
              <div className="gc-logo-text">
                <div className="gc-main-title">AI Teaching Assistant</div>
                <div className="gc-sub-title">Automated Generation Module • Document ID #{materialId}</div>
              </div>
            </div>
          </div>

          <div className="gc-top-bar-right">
            <div className="gc-ai-status-pill gc-hide-mobile">
              <span className="gc-dot-blink" />
              <span className="gc-status-text">LLM Pipeline Active</span>
            </div>
            <button className="gc-mobile-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── CENTRAL SUB-WORKSPACE LAYOUT PANEL ── */}
      <div className="gc-main-layout">
        
        {/* Mobile Sidebar overlay backdrop link */}
        {sidebarOpen && <div className="gc-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ── SIDEBAR SELECTION PANEL MODES ── */}
        <aside className={`gc-sidebar ${sidebarOpen ? 'sidebar-open-state' : ''}`}>
          <div className="gc-sidebar-inner-container">
            <div className="gc-sidebar-header">Generation Formats</div>
            <div className="gc-sidebar-scrollable-area">
              {OPTIONS.map((opt, i) => {
                const isActive = contentType === opt.id && (opt.detailed ? detailedType === opt.detailed : true);
                return (
                  <button 
                    key={i} 
                    className={`gc-opt-btn ${isActive ? 'active-option-state' : ''}`} 
                    onClick={() => { setContentType(opt.id); setDetailedType(opt.detailed || null); if(window.innerWidth < 900) setSidebarOpen(false); }}
                    style={{ '--accent': opt.color, '--accent-bg': opt.bg }}
                  >
                    <div className="gc-opt-icon">{opt.icon}</div>
                    <span className="gc-opt-label">{opt.label}</span>
                    {isActive && <div className="gc-active-dot" />}
                  </button>
                );
              })}
            </div>

            {/* Post Generation Asset Export Deck */}
            {generatedData && (
              <div className="gc-sidebar-footer-block">
                <div className="gc-sidebar-header">Asset Configurations</div>
                {contentType === 'quiz' && (
                  <button onClick={handlePushToInteractiveQuiz} className="gc-btn-interactive- quiz">
                    🚀 Push to Evaluation Feed
                  </button>
                )}
                <div className="gc-export-button-vertical-group">
                  <button onClick={() => handleDownload('pdf', false)} className="gc-btn-export-node">PDF Student Copy</button>
                  <button onClick={() => handleDownload('docx', true)} className="gc-btn-export-node">Word Answer Key</button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── CHAT ENGINE RESPONSE TERMINAL PANEL ── */}
        <div className="gc-chat-panel">
          <header className="gc-chat-panel-header">
            <div className="gc-chat-header-info">
              <div className="gc-chat-header-icon-avatar" style={{ background: accentBg, border: `1px solid ${accent}33` }}>{selectedOption?.icon || '🤖'}</div>
              <div className="gc-chat-header-text-block">
                <div className="gc-chat-title">{selectedOption?.label} Generation Engine</div>
                <div className="gc-chat-subtitle">Analyzing raw vector indices splits for content extraction...</div>
              </div>
            </div>
            {chatHistory.length > 0 && (
              <button onClick={() => { setChatHistory([]); setGeneratedData(null); setSystemAlert({ type: '', text: '' }); }} className="gc-btn-clear-chat">Clear History</button>
            )}
          </header>
          
          <div ref={chatBoxRef} className="gc-chat-messages-scroll-area">
            {systemAlert.text && (
              <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} gc-spaced-alert-banner`}>
                {systemAlert.text}
              </div>
            )}

            {chatHistory.length === 0 ? (
              <div className="gc-empty-chat-state-console">
                <div className="gc-empty-icon-box">🧠</div>
                <h2>Context Architecture Ready</h2>
                <p>Select your desired analytical curriculum target on the left sidebar context or prompt the AI system custom constraints directly.</p>
                <div className="gc-suggestion-chips-deck">
                  {SUGGESTIONS.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setCustomPrompt(s)} 
                      className="gc-chip-btn" 
                      style={{ '--accent': accent, '--accent-bg': accentBg }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`gc-msg-row ${msg.role === 'user' ? 'msg-user-variant' : 'msg-ai-variant'}`}>
                  <div className="gc-msg-avatar-node">{msg.role === 'user' ? '👤' : '🤖'}</div>
                  <div className="gc-msg-content-wrapper-box">
                    <div className="gc-msg-bubble" style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #1d4ed8, #0284c7)' } : {}}>{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="gc-msg-row msg-ai-variant">
                <div className="gc-msg-avatar-node">🤖</div>
                <div className="gc-loading-bubble-wait-state">
                  <span className="gc-dot-bounce" style={{ '--delay': '0s' }} />
                  <span className="gc-dot-bounce" style={{ '--delay': '0.2s' }} />
                  <span className="gc-dot-bounce" style={{ '--delay': '0.4s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Prompt Entry Input Sub-System Control */}
          <div className="gc-chat-input-container">
            <div className="gc-chat-input-bar-rail">
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                placeholder={`Submit operational directives for structural ${selectedOption?.label || 'content'} extraction...`}
                rows={1}
              />
              <button onClick={handleGenerate} disabled={loading} className="gc-btn-send-message">
                {loading ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateContent;