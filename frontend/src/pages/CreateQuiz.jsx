import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const CreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [title, setTitle] = useState(location.state?.title || '');
  const [timeLimit, setTimeLimit] = useState(10); 
  const [deadline, setDeadline] = useState(''); 
  const [questions, setQuestions] = useState([
    { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    if (location.state?.aiGeneratedContent) {
      try {
        const aiText = location.state.aiGeneratedContent;
        const questionBlocks = aiText
          .split(/(?:Question\s*\d+[:\.]?|(?:\n|^)\d+[\.\)])/gi)
          .map(block => block.trim())
          .filter(block => block.length > 15);

        const parsedQuestions = questionBlocks.map(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l !== '');
          const questionText = lines.find(l => !l.match(/^[A-D][\.\)\-:]/i)) || "Untitled Question";
          const options = { A: '', B: '', C: '', D: '' };
          let correct = 'A';

          lines.forEach(line => {
            const lowerLine = line.toLowerCase();
            if (line.match(/^[aA][\.\)\-:]/)) options.A = line.replace(/^[aA][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[bB][\.\)\-:]/)) options.B = line.replace(/^[bB][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[cC][\.\)\-:]/)) options.C = line.replace(/^[cC][\.\)\-:]\s*/, '').trim();
            if (line.match(/^[dD][\.\)\-:]/)) options.D = line.replace(/^[dD][\.\)\-:]\s*/, '').trim();
            
            if (lowerLine.includes('correct') || lowerLine.includes('answer:')) {
                if (lowerLine.match(/[:\s]a(?!\w)/)) correct = 'A';
                else if (lowerLine.match(/[:\s]b(?!\w)/)) correct = 'B';
                else if (lowerLine.match(/[:\s]c(?!\w)/)) correct = 'C';
                else if (lowerLine.match(/[:\s]d(?!\w)/)) correct = 'D';
            }
          });
          return { text: questionText, options, correct };
        });

        if (parsedQuestions.length > 0) setQuestions(parsedQuestions);
      } catch (err) {
        console.error("Error parsing structural raw AI prompt content text mappings:", err);
      }
    }
  }, [location.state]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { text: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A' }]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  const removeQuestion = (index) => {
    setQuestions(prev => {
        const list = [...prev];
        list.splice(index, 1);
        return list;
    });
  };

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => {
        const list = [...prev];
        if (field.startsWith('option_')) {
            const key = field.split('_')[1]; 
            list[index].options[key] = value;
        } else {
            list[index][field] = value;
        }
        return list;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSystemAlert({ type: '', text: '' });
    
    if (!title.trim()) return setSystemAlert({ type: 'error', text: 'Validation Error: Please enter a quiz title.' });
    if (questions.some(q => !q.text.trim() || !q.options.A.trim() || !q.options.B.trim())) {
      return setSystemAlert({ type: 'error', text: 'Validation Error: Please completely fill out questions text strings and required base options.' });
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/api/quiz/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                course_id: courseId, title: title.trim(), time_limit: Number(timeLimit),
                questions: questions, is_published: true, deadline: deadline || null 
            })
        });

        if (res.ok) {
            setSystemAlert({ type: 'success', text: '🚀 Assessment successfully compiled and assigned to student rosters!' });
            setTimeout(() => navigate(`/course/${courseId}`), 2000);
        } else {
            const d = await res.json();
            setSystemAlert({ type: 'error', text: d.error || "Transaction Failure: Stalled committing evaluation parameters." });
        }
    } catch (err) {
        setSystemAlert({ type: 'error', text: 'Network Error: Stalled posting data matrix packet segments.' });
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="cq-page-wrapper">
      <Navbar />

      {/* ── HERO HEADER PANEL CONSOLE ── */}
      <div className="cq-hero-banner">
        <div className="cq-grid-mesh" />
        <div className="cq-hero-container">
          <button onClick={() => navigate(-1)} className="cq-btn-back-trans"> ← Back </button>
          <div className="cq-hero-flex-header-row">
            <div className="cq-hero-text-block">
                <h1>{location.state?.aiGeneratedContent ? "Review AI Content Matrix" : "Create Evaluation Quiz"}</h1>
                <p>{location.state?.aiGeneratedContent ? "Crosscheck, modify, and confirm the RAG generated testing segments below." : "Manually formulate baseline question configurations entries."}</p>
            </div>
            <button onClick={addQuestion} className="cq-btn-white-action"> + Add Question Element </button>
          </div>
        </div>
      </div>

      {/* ── CORE COMPILATION WORKSPACE PANEL DECK ── */}
      <div className="cq-form-content-area">
        
        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} cq-spaced-banner-margin`}>
            {systemAlert.text}
          </div>
        )}

        {/* METRICS CONFIGURATION PARAMETERS CARD */}
        <div className="cq-config-card-panel">
            <h3 className="cq-config-inner-title">⚙️ Operational Configuration</h3>
            <div className="cq-config-grid-matrix">
                <div className="auth-form-group">
                    <label className="cq-input-form-label">Quiz Assessment Title</label>
                    <input placeholder="e.g., Mid-Term Assessment" value={title} onChange={e => setTitle(e.target.value)} className="rp-input-field" />
                </div>
                <div className="auth-form-group">
                    <label className="cq-input-form-label">Time Limit Allocation (Mins)</label>
                    <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className="rp-input-field" min={1} />
                </div>
                <div className="auth-form-group full-width-tablet-grid-cell">
                    <label className="cq-input-form-label">Submission Cut-off Deadline</label>
                    <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="rp-input-field font-family-inherit-override" />
                </div>
            </div>
        </div>

        {/* QUESTIONS GENERATED MATRIX CONTAINER LISTINGS */}
        {questions.map((q, index) => (
            <div key={index} className="cq-question-entry-card-node">
                <div className="cq-card-header-flex-row">
                    <h4 className="cq-question-number-pill"> Evaluation Question {index + 1} </h4>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(index)} className="cq-btn-remove-soft"> Remove Block </button>
                    )}
                </div>
                <textarea 
                    placeholder="Provide evaluation problem inquiry description string here..." 
                    value={q.text} 
                    onChange={(e) => handleQuestionChange(index, 'text', e.target.value)} 
                    className="rp-input-field cq-textarea-vertical-resize-lock"
                />
                
                <div className="cq-options-input-grid-matrix-2">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt} className="cq-option-input-row-group">
                            <span className="cq-option-marker-prefix">{opt}:</span>
                            <input placeholder={`Option string ${opt}`} value={q.options[opt]} onChange={(e) => handleQuestionChange(index, `option_${opt}`, e.target.value)} className="rp-input-field cq-input-option-adjustment" />
                        </div>
                    ))}
                </div>

                <div className="cq-correct-answer-select-row-banner">
                    <label>Designate Correct Choice Parameter Target:</label>
                    <select value={q.correct} onChange={(e) => handleQuestionChange(index, 'correct', e.target.value)} className="rp-input-field cq-select-dropdown-adjustment">
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                    </select>
                </div>
            </div>
        ))}

        {/* BOTTOM WORKSPACE FOOTER ACTIONS CONTROL BAR */}
        <div className="cq-quiz-actions-footer-strip">
            <button onClick={addQuestion} className="cq-btn-add-another-dashed-trigger"> + Add Another Question Node </button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary cq-btn-submit-main-publish">
                {submitting ? 'Compiling Assessment Matrix Changes...' : 'Publish & Broadcast Quiz Roster '}
            </button>
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .cq-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
        
        .cq-hero-banner { background: linear-gradient(150deg, #111827 0%, #1f2937 50%, #374151 100%); padding: 46px 0 100px; position: relative; overflow: hidden; }
        .cq-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 26px 26px; }
        .cq-hero-container { max-width: 960px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .cq-btn-back-trans { background: rgba(255,255,255,0.08); color: #f3f4f6; border: 1px solid rgba(255,255,255,0.15); padding: 7px 14px; border-radius: 6px; cursor: pointer; font-size: 0.825rem; font-weight: 600; margin-bottom: 20px; transition: background 0.2s; }
        .cq-btn-back-trans:hover { background: rgba(255,255,255,0.15); }
        
        .cq-hero-flex-header-row { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px; }
        .cq-hero-text-block h1 { color: #ffffff; font-size: clamp(1.6rem, 4.5vw, 2.2rem); font-weight: 900; margin: 0; letter-spacing: -0.75px; }
        .cq-hero-text-block p { color: #9ca3af; margin: 6px 0 0 0; font-size: 0.95rem; font-weight: 500; }
        
        .cq-btn-white-action { background: #ffffff; color: #111827; border: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: background 0.2s, transform 0.1s; }
        .cq-btn-white-action:hover { background: #f9fafb; }
        .cq-btn-white-action:active { transform: scale(0.98); }
        
        .cq-form-content-area { max-width: 960px; margin: -45px auto 0; padding: 0 24px; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .cq-spaced-banner-margin { margin-bottom: -4px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        /* Configurations Control Block Panel */
        .cq-config-card-panel { background: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); }
        .cq-config-inner-title { margin: 0 0 20px 0; font-size: 1.05rem; font-weight: 800; color: #1f2937; letter-spacing: -0.2px; text-transform: uppercase; font-size: 0.85rem; color: #4b5563; }
        .cq-config-grid-matrix { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 16px; }
        .cq-input-form-label { display: block; margin-bottom: 7px; font-weight: 700; color: #4b5563; font-size: 0.775rem; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Questions Array Node Entries */
        .cq-question-entry-card-node { background: #ffffff; padding: 28px; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 16px; position: relative; animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .cq-card-header-flex-row { display: flex; justify-content: space-between; align-items: center; }
        .cq-question-number-pill { margin: 0; background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 800; border: 1px solid #e5e7eb; }
        
        .cq-btn-remove-soft { background: none; border: none; color: #ef4444; font-weight: 700; font-size: 0.825rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.15s; }
        .cq-btn-remove-soft:hover { background: #fef2f2; }
        .cq-textarea-vertical-resize-lock { resize: vertical; min-height: 80px; margin-bottom: 0px !important; line-height: 1.5; }
        
        /* Options Data Fields Matrix Layout */
        .cq-options-input-grid-matrix-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cq-option-input-row-group { display: flex; align-items: center; gap: 10px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 4px 12px; border-radius: 8px; }
        .cq-option-marker-prefix { font-weight: 800; color: #6b7280; font-size: 0.95rem; width: 14px; }
        .cq-input-option-adjustment { border: none !important; background: transparent !important; padding: 8px 0 !important; box-shadow: none !important; margin-bottom: 0 !important; font-size: 0.9rem !important; }
        .cq-input-option-adjustment:focus { border: none !important; box-shadow: none !important; }
        
        .cq-correct-answer-select-row-banner { display: flex; align-items: center; gap: 14px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: #065f46; margin-top: 4px; }
        .cq-correct-answer-select-row-banner label { flex-shrink: 0; }
        .cq-select-dropdown-adjustment { width: 130px !important; margin-bottom: 0px !important; padding: 6px 10px !important; height: 32px !important; font-size: 0.85rem !important; background: #ffffff !important; font-weight: 700; }
        
        /* Workspace Footer Block Link Row */
        .cq-quiz-actions-footer-strip { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; margin-bottom: 40px; gap: 20px; flex-wrap: wrap; }
        .cq-btn-add-another-dashed-trigger { background: transparent; border: 2px dashed #cbd5e1; color: #4b5563; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
        .cq-btn-add-another-dashed-trigger:hover { border-color: #9ca3af; background: #ffffff; color: #1f2937; }
        
        .cq-btn-submit-main-publish { padding: 14px 28px !important; font-weight: 800; font-size: 0.95rem; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(79,70,229,0.25); }
        .cq-btn-submit-main-publish:disabled { background: #9ca3af !important; cursor: not-allowed; box-shadow: none; }
        .font-family-inherit-override { font-family: inherit !important; }

        /* Mobile Device Configuration Breakpoint Scales */
        @media (max-width: 768px) {
          .cq-config-grid-matrix { grid-template-columns: 1fr; gap: 12px; }
          .cq-options-input-grid-matrix-2 { grid-template-columns: 1fr; gap: 12px; }
          .cq-hero-flex-header-row { flex-direction: column; align-items: stretch; }
          .cq-btn-white-action { width: 100%; text-align: center; }
          .cq-quiz-actions-footer-strip { flex-direction: column; align-items: stretch; }
          .cq-btn-add-another-dashed-trigger { width: 100%; text-align: center; }
          .cq-btn-submit-main-publish { width: 100%; text-align: center; }
          .cq-correct-answer-select-row-banner { flex-direction: column; align-items: stretch; gap: 8px; }
          .cq-select-dropdown-adjustment { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};

export default CreateQuiz;