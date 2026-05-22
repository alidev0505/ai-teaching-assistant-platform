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
    </div>
  );
};

export default CreateQuiz;