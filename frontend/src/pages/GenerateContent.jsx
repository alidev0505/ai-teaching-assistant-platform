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
                    style={{ '--local-accent': opt.color, '--local-accent-bg': opt.bg }}
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
                  <button onClick={handlePushToInteractiveQuiz} className="gc-btn-interactive-quiz">
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
                      style={{ '--local-chip-accent': accent, '--local-chip-accent-bg': accentBg }}
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
                    <div className="gc-msg-bubble" style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', color: '#ffffff' } : {}}>{msg.content}</div>
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
              <button onClick={handleGenerate} disabled={loading || !customPrompt.trim()} className="gc-btn-send-message">
                {loading ? '...' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .gc-page-wrapper { display: flex; flex-direction: column; height: 100vh; background-color: #f8fafc; overflow: hidden; font-family: 'Inter', sans-serif; }
        
        /* Top Navigation Header bar Controls primitive elements layout links */
        .gc-top-bar { height: 72px; background-color: #0f172a; position: relative; display: flex; align-items: center; z-index: 1100; border-bottom: 1px solid #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .gc-hero-mesh-overlay { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none; }
        .gc-top-bar-container { width: 100%; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
        .gc-top-bar-left { display: flex; align-items: center; gap: 16px; }
        
        .gc-btn-back { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #ffffff; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; cursor: pointer; transition: background 0.2s; }
        .gc-btn-back:hover { background: rgba(255,255,255,0.16); }
        
        .gc-logo-area { display: flex; align-items: center; gap: 12px; }
        .gc-logo-icon { font-size: 1.6rem; line-height: 1; }
        .gc-logo-text { display: flex; flex-direction: column; }
        .gc-main-title { color: #ffffff; font-weight: 800; font-size: 0.95rem; letter-spacing: -0.2px; }
        .gc-sub-title { color: #64748b; font-size: 0.75rem; font-weight: 500; margin-top: 1px; }
        
        .gc-top-bar-right { display: flex; align-items: center; gap: 14px; }
        .gc-ai-status-pill { display: flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); padding: 6px 14px; border-radius: 50px; }
        .gc-dot-blink { width: 7px; height: 7px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: gc-pulse 1.8s infinite; }
        .gc-status-text { color: #34d399; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
        .gc-mobile-sidebar-toggle { display: none; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
        
        /* Layout split panes primitive components configurations properties */
        .gc-main-layout { display: flex; flex: 1; overflow: hidden; position: relative; }
        .gc-sidebar-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); z-index: 990; }
        
        .gc-sidebar { width: 300px; background-color: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; z-index: 1000; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .gc-sidebar-inner-container { display: flex; flex-direction: column; height: 100%; padding: 20px 16px; box-sizing: border-box; }
        .gc-sidebar-header { font-size: 0.725rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 12px; padding-left: 8px; }
        .gc-sidebar-scrollable-area { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding-right: 2px; }
        
        /* Interactive dynamic sidebar option buttons */
        .gc-opt-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border: 1px solid transparent; background: transparent; border-radius: 10px; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.2s ease; position: relative; }
        .gc-opt-btn:hover { background-color: #f1f5f9; }
        .gc-opt-btn.active-option-state { background-color: var(--local-accent-bg); border-color: rgba(0,0,0,0.02); }
        .gc-opt-icon { font-size: 1.25rem; line-height: 1; }
        .gc-opt-label { font-size: 0.875rem; font-weight: 600; color: #334155; }
        .gc-opt-btn.active-option-state .gc-opt-label { color: var(--local-accent); font-weight: 800; }
        .gc-active-dot { width: 5px; height: 5px; background-color: var(--local-accent); border-radius: 50%; position: absolute; right: 14px; }
        
        /* Sidebar export decks control blocks modules */
        .gc-sidebar-footer-block { border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 16px; display: flex; flex-direction: column; gap: 12px; animation: slideInUp 0.2s ease-out; }
        .gc-btn-interactive-quiz { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; border: none; padding: 11px; border-radius: 8px; font-weight: 700; font-size: 0.825rem; cursor: pointer; font-family: inherit; box-shadow: 0 4px 10px rgba(99,102,241,0.2); transition: opacity 0.2s; }
        .gc-btn-interactive-quiz:hover { opacity: 0.95; }
        .gc-export-button-vertical-group { display: flex; flex-direction: column; gap: 6px; }
        .gc-btn-export-node { background-color: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 9px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; font-family: inherit; transition: background 0.15s; text-align: center; }
        .gc-btn-export-node:hover { background-color: #f8fafc; color: #0f172a; border-color: #94a3b8; }
        
        /* Central chat pane messaging consoles terminals descriptors */
        .gc-chat-panel { flex: 1; display: flex; flex-direction: column; background-color: #ffffff; overflow: hidden; position: relative; }
        .gc-chat-panel-header { height: 68px; padding: 0 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background-color: #ffffff; }
        .gc-chat-header-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .gc-chat-header-icon-avatar { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .gc-chat-header-text-block { display: flex; flex-direction: column; min-width: 0; }
        .gc-chat-title { font-weight: 800; color: #1e293b; font-size: 0.925rem; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gc-chat-subtitle { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gc-btn-clear-chat { background: none; border: none; color: #94a3b8; font-weight: 700; font-size: 0.8rem; cursor: pointer; font-family: inherit; padding: 6px 12px; border-radius: 6px; }
        .gc-btn-clear-chat:hover { background-color: #f1f5f9; color: #64748b; }
        
        /* Chat messages listings components entries arrays loops values layout */
        .gc-chat-messages-scroll-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; background-color: #f8fafc; box-sizing: border-box; }
        .gc-spaced-alert-banner { margin-bottom: 0px !important; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        
        .gc-msg-row { display: flex; gap: 14px; animation: slideInUp 0.2s ease-out; }
        .gc-msg-row.msg-user-variant { flex-direction: row-reverse; }
        .gc-msg-avatar-node { width: 34px; height: 34px; border-radius: 50%; background-color: #ffffff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .gc-msg-content-wrapper-box { display: flex; flex-direction: column; max-width: 75%; }
        
        .gc-msg-bubble { background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 14px; font-size: 0.925rem; line-height: 1.6; word-break: break-word; box-shadow: 0 2px 4px rgba(0,0,0,0.01); white-space: pre-wrap; }
        .gc-msg-row.msg-user-variant .gc-msg-bubble { border: none; box-shadow: 0 4px 10px rgba(29,78,216,0.15); }
        
        /* Suggestion chips decks initial splash layout definitions primitives */
        .gc-empty-chat-state-console { margin: auto; max-width: 460px; text-align: center; display: flex; flex-direction: column; align-items: center; padding: 20px; box-sizing: border-box; }
        .gc-empty-icon-box { font-size: 2.8rem; line-height: 1; margin-bottom: 14px; opacity: 0.85; animation: gc-float-bounce 3s ease-in-out infinite; }
        .gc-empty-chat-state-console h2 { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.3px; }
        .gc-empty-chat-state-console p { font-size: 0.85rem; color: #64748b; margin: 6px 0 20px 0; line-height: 1.5; }
        .gc-suggestion-chips-deck { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        
        .gc-chip-btn { background-color: #ffffff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 0.825rem; font-weight: 600; color: #475569; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s ease; width: 100%; }
        .gc-chip-btn:hover { border-color: var(--local-chip-accent); background-color: var(--local-chip-accent-bg); color: var(--local-chip-accent); transform: translateX(2px); }
        
        /* Loading wait dynamic dot tracking indicator bubble styles components */
        .gc-loading-bubble-wait-state { background-color: #ffffff; border: 1px solid #e2e8f0; padding: 14px 20px; border-radius: 14px; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
        .gc-dot-bounce { width: 6px; height: 6px; background-color: #94a3b8; border-radius: 50%; animation: gc-dot-bounce-loop 1.2s infinite ease-in-out both; animation-delay: var(--delay); }
        
        /* Chat parameter entries input area sub-system controllers docks container */
        .gc-chat-input-container { padding: 18px 24px; border-top: 1px solid #e2e8f0; background-color: #ffffff; flex-shrink: 0; }
        .gc-chat-input-bar-rail { display: flex; align-items: center; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 6px 10px 6px 14px; box-sizing: border-box; gap: 10px; transition: border-color 0.2s, background-color 0.2s; }
        .gc-chat-input-bar-rail:focus-within { border-color: #2563eb; background-color: #ffffff; }
        
        .gc-chat-input-bar-rail textarea { flex: 1; border: none !important; background: transparent !important; padding: 6px 0 !important; font-size: 0.925rem !important; outline: none !important; resize: none !important; max-height: 80px; font-family: inherit !important; color: #0f172a !important; margin-bottom: 0px !important; }
        
        .gc-btn-send-message { width: 32px; height: 32px; background: linear-gradient(135deg, #1d4ed8, #0284c7); color: #ffffff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; padding-bottom: 2px; transition: opacity 0.15s, transform 0.1s; }
        .gc-btn-send-message:hover:not(:disabled) { opacity: 0.95; }
        .gc-btn-send-message:disabled { background: #e2e8f0 !important; color: #94a3b8 !important; cursor: not-allowed; transform: none !important; }
        .gc-btn-send-message:active:not(:disabled) { transform: scale(0.95); }
        
        /* System operational loops keyframes tracking paths primitives animation bindings */
        @keyframes gc-pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        @keyframes gc-dot-bounce-loop { 0%, 80%, 100% { transform: scale(0); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
        @keyframes gc-float-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes slideInUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Mobile adaptive viewport breakpoints scaling adaptation link nodes selectors */
        @media (max-width: 900px) {
          .gc-mobile-sidebar-toggle { display: block; }
          .gc-hide-mobile { display: none !important; }
          .gc-sidebar { position: absolute; top: 0; bottom: 0; left: 0; transform: translateX(-100%); box-shadow: 10px 0 30px rgba(0,0,0,0.15); border-right: none; }
          .gc-sidebar.sidebar-open-state { transform: translateX(0); }
          .gc-msg-content-wrapper-box { max-width: 88%; }
          .gc-chat-panel-header { padding: 0 16px; }
          .gc-chat-messages-scroll-area { padding: 16px; gap: 16px; }
          .gc-chat-input-container { padding: 12px 16px; }
        }
      `}</style>
    </div>
  );
};

export default GenerateContent;