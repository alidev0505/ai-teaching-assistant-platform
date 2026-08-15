import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); 
  
  // 👇 NEW: We use a Ref to track answers for emergency auto-submits so it never submits blank!
  const answersRef = useRef({}); 
  
  const [timeLeft, setTimeLeft] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Initial Load & Setup
  useEffect(() => {
    const fetchQuiz = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/api/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setQuiz(data.quiz);
          // Set timer based on question array length (1 min per question)
          const qCount = Array.isArray(data.quiz.questions) ? data.quiz.questions.length : 10;
          setTimeLeft(qCount * 60); 
        } else {
          setErrorMsg(data.error || "Verification failure: Failed to pull quiz data elements.");
        }
      } catch (err) {
        console.error("Critical evaluation environment retrieval failure:", err);
        setErrorMsg("Failed to connect to the evaluation server infrastructure.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // 2. Prevent accidental browser close/reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answersRef.current).length > 0 && !submitting) {
        e.preventDefault();
        e.returnValue = 'Warning: Active evaluation records state changes are uncommitted. Confirm exit operation?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitting]);

  // 3. Central Submission Logic
  const handleSubmit = async (isAuto = false) => {
    if (submitting) return; 
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quiz_id: quizId, answers: answersRef.current }) // Uses the Ref to guarantee latest answers
      });
      const result = await res.json();
      
      if (res.ok) {
        if (!isAuto) {
          alert(`🎉 Assessment Processed!\nScore Summary Metrics: ${result.correct}/${result.total} (${Number(result.score).toFixed(2)}%)`);
        }
        const redirectId = quiz?.course_id || localStorage.getItem('last_course_id');
        navigate(redirectId ? `/course/${redirectId}` : '/student');
      } else {
        alert(result.error || "Submission transaction failure payload mapping occurred.");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Network processing disruption: Stalled transmitting response data packets.");
      setSubmitting(false);
    }
  };

  // 4. ANTI-CHEAT: Detect Tab Switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && quiz && !submitting && timeLeft > 0) {
        alert("🛑 ANTI-CHEAT TRIGGERED: You left the quiz tab! Your test has been disqualified and automatically submitted.");
        handleSubmit(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quiz, submitting, timeLeft]);

  // 5. ROCK-SOLID TIMER COUNTDOWN
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;
    
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          console.warn("Time expired. Auto-submitting.");
          handleSubmit(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Only resets if the component unmounts, preventing freezes
    return () => clearInterval(timerId); 
  }, [timeLeft === null, submitting]);

  const formatTime = (seconds) => {
    if (seconds === null || isNaN(seconds)) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (qId, optionKey) => {
    if (submitting) return;
    setAnswers(prev => {
      const updated = { ...prev, [qId]: optionKey };
      answersRef.current = updated; // Syncs the ref so Auto-Submit always has your latest click!
      return updated;
    });
  };

  if (loading) return (
    <div className="tq-loading-splash">
      <div className="tq-spinner-circle" />
      <p>Compiling Cryptographic Testing Environment Elements...</p>
      <style>{`
        .tq-loading-splash { min-height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; font-family: 'Inter', sans-serif; color: #475569; font-weight: 600; }
        .tq-spinner-circle { width: 44px; height: 44px; border: 4px solid #cbd5e1; border-top-color: #3b82f6; border-radius: 50%; animation: tq-spin 0.8s linear infinite; }
        @keyframes tq-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (errorMsg) {
    return (
      <div className="tq-error-page-wrapper">
        <div className="tq-error-card">
          <div className="tq-error-icon">🛑</div>
          <h2 className="tq-error-title">Access Reference Blocked</h2>
          <p className="tq-error-disclaimer">{errorMsg}</p>
          <button onClick={() => navigate(-1)} className="tq-btn-back-fallback">← Return to Previous Hub</button>
        </div>
        <style>{`
          .tq-error-page-wrapper { min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif; }
          .tq-error-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
          .tq-error-icon { font-size: 3rem; margin-bottom: 12px; line-height: 1; }
          .tq-error-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 10px; letter-spacing: -0.3px; }
          .tq-error-disclaimer { font-size: 0.9rem; color: #64748b; line-height: 1.5; margin: 0 0 24px; }
          .tq-btn-back-fallback { width: 100%; padding: 12px; background-color: #1e293b; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.15s; }
          .tq-btn-back-fallback:hover { background-color: #0f172a; }
        `}</style>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="tq-page-wrapper">
      
      {/* ── STICKY VIEWPORTS COMPLIANCE NAVIGATION STACK ── */}
      <header className="tq-sticky-header">
        <div className="tq-header-container">
          <div className="tq-quiz-meta-block">
            <h3 className="tq-quiz-title-text">{quiz.title}</h3>
            <span className="tq-hide-mobile">{quiz.deadline ? `Target Deadline: ${new Date(quiz.deadline).toLocaleDateString()}` : 'Institutional Session Testing'}</span>
          </div>
          
          {/* 👇 THE BULLETPROOF TIMER UI 👇 */}
          <div 
            className={`tq-timer-box-indicator ${timeLeft !== null && timeLeft < 60 ? 'tq-timer-state-urgent' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}
          >
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            <span className="tq-hide-mobile" style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', letterSpacing: '0.5px' }}>TIME REMAINING:</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* ── QUESTION DECK COMPILATION VIEWS ── */}
      <main className="tq-main-content-layout">
        {quiz.questions.map((q, index) => (
          <div key={q.id} className="tq-question-card-node">
            <div className="tq-question-text-row">
              <span className="tq-question-number-badge">Q{index + 1}</span> 
              <p className="tq-question-body-paragraph">{q.text}</p>
            </div>

            <div className="tq-options-grid-matrix">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <div 
                    key={opt} 
                    onClick={() => handleSelect(q.id, opt)} 
                    className={`tq-option-item-row ${isSelected ? 'active-selected-option-state' : ''}`}
                  >
                    <div className="tq-custom-radio-circle" />
                    <span className="tq-option-text-string">{q.options[opt]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── FIXED OVERLAY BOTTOM OPERATIONS CONTROL BAR ── */}
        <footer className="tq-sticky-footer-bar">
          <div className="tq-footer-container">
            <div className="tq-progress-indicator-block">
              <div className="tq-progress-string-header">PROGRESS MATRIX</div>
              <div className="tq-progress-numerical-counter">{Object.keys(answers).length} / {quiz.questions.length} Questions Submitted</div>
            </div>
            <button 
              onClick={() => handleSubmit(false)} 
              disabled={submitting} 
              className="tq-btn-finish-exam-submit"
            >
              {submitting ? 'Transmitting Data Matrix...' : 'Finish Evaluation 🚀'}
            </button>
          </div>
        </footer>
      </main>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .tq-page-wrapper { background-color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; }
        
        /* Sticky Top Header Realtime Countdown Timer Box */
        .tq-sticky-header { position: fixed; top: 70px; left: 0; right: 0; height: 72px; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; z-index: 1000; display: flex; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .tq-header-container { max-width: 840px; width: 100%; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
        
        .tq-quiz-meta-block { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .tq-quiz-title-text { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tq-quiz-meta-block span { color: #64748b; font-size: 0.775rem; font-weight: 600; }
        
        .tq-timer-box-indicator { display: flex; align-items: center; background-color: #f1f5f9; padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; flex-shrink: 0; }
        .tq-timer-box-indicator .tq-hide-mobile { font-size: 0.725rem; font-weight: 800; color: #475569; letter-spacing: 0.5px; }
        .tq-timer-numerical-value { font-size: 1.1rem; font-weight: 900; color: #0f172a; font-variant-numeric: tabular-nums; }
        
        /* Urgent Danger Timer Blink state codes */
        .tq-timer-box-indicator.tq-timer-state-urgent { background-color: #fef2f2; border-color: #fca5a5; animation: tq-warning-pulse 1s linear infinite alternate; }
        .tq-timer-box-indicator.tq-timer-state-urgent .tq-timer-numerical-value { color: #dc2626; }
        
        /* Layout Main Grid Matrix Cards Array */
        .tq-main-content-layout { max-width: 840px; width: 100%; margin: 150px auto 0; padding: 32px 24px 110px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; }
        .tq-question-card-node { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 20px; }
        
        .tq-question-text-row { display: flex; gap: 14px; align-items: flex-start; }
        .tq-question-number-badge { background-color: #eff6ff; color: #2563eb; font-weight: 900; font-size: 0.85rem; padding: 4px 10px; border-radius: 6px; border: 1px solid #bfdbfe; flex-shrink: 0; line-height: 1.2; }
        .tq-question-body-paragraph { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e293b; line-height: 1.5; }
        
        /* Multi Choice Option Blocks row alignments */
        .tq-options-grid-matrix { display: flex; flex-direction: column; gap: 10px; }
        .tq-option-item-row { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; user-select: none; }
        .tq-option-item-row:hover { background-color: #f8fafc; border-color: #94a3b8; }
        
        .tq-custom-radio-circle { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #cbd5e1; background-color: #ffffff; flex-shrink: 0; position: relative; transition: all 0.2s ease; }
        .tq-option-text-string { font-size: 0.95rem; font-weight: 600; color: #334155; line-height: 1.4; }
        
        /* Active Radio Option Trigger States rules bindings */
        .tq-option-item-row.active-selected-option-state { background-color: #eff6ff; border-color: #3b82f6; box-shadow: 0 2px 4px rgba(59,130,246,0.04); }
        .tq-option-item-row.active-selected-option-state .tq-custom-radio-circle { border-color: #3b82f6; background-color: #3b82f6; }
        .tq-option-item-row.active-selected-option-state .tq-custom-radio-circle::after { content: ''; position: absolute; width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .tq-option-item-row.active-selected-option-state .tq-option-text-string { color: #1e40af; font-weight: 800; }
        
        /* Bottom Overlay Sticky Examination control panels dock bar */
        .tq-sticky-footer-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background-color: #0f172a; border-top: 1px solid #1e293b; z-index: 1000; display: flex; align-items: center; box-shadow: 0 -4px 15px rgba(0,0,0,0.15); }
        .tq-footer-container { max-width: 840px; width: 100%; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
        
        .tq-progress-indicator-block { display: flex; flex-direction: column; gap: 2px; }
        .tq-progress-string-header { font-size: 0.675rem; font-weight: 800; color: #64748b; letter-spacing: 0.75px; }
        .tq-progress-numerical-counter { color: #e2e8f0; font-size: 0.9rem; font-weight: 700; }
        
        .tq-btn-finish-exam-submit { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.25); transition: background 0.15s, transform 0.1s; font-family: inherit; }
        .tq-btn-finish-exam-submit:hover:not(:disabled) { opacity: 0.95; }
        .tq-btn-finish-exam-submit:active:not(:disabled) { transform: scale(0.98); }
        .tq-btn-finish-exam-submit:disabled { background: #475569 !important; color: #94a3b8 !important; cursor: not-allowed; box-shadow: none; }
        
        .tq-hide-mobile { display: inline; }
        @keyframes tq-warning-pulse { 0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.05); } 100% { box-shadow: 0 0 0 6px rgba(220,38,38,0.15); } }

        /* Mobile Viewport Shifters Adapters scaling rules triggers */
        @media (max-width: 640px) {
          .tq-hide-mobile { display: none !important; }
          .tq-sticky-header { top: 60px; height: 60px; }
          .tq-sticky-header { height: 60px; }
          .tq-main-content-layout { margin-top: 60px; padding: 16px 16px 96px; gap: 16px; }
          .tq-question-card-node { padding: 20px; gap: 14px; }
          .tq-question-body-paragraph { font-size: 0.95rem; }
          .tq-option-item-row { padding: 12px 14px; gap: 10px; }
          .tq-option-text-string { font-size: 0.875rem; }
          .tq-sticky-footer-bar { height: 72px; }
          .tq-btn-finish-exam-submit { padding: 10px 16px; font-size: 0.85rem; }
        }
      `}</style>
    </div>
  );
};

export default TakeQuiz;