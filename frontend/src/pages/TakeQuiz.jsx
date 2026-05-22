import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); 
  const [timeLeft, setTimeLeft] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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
          setTimeLeft(data.quiz.time_limit * 60);
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

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && !submitting) {
        e.preventDefault();
        e.returnValue = 'Warning: Active evaluation records state changes are uncommitted. Confirm exit operation?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, submitting]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleAutoSubmit(); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (qId, optionKey) => {
    if (submitting) return;
    setAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmit = async (isAuto = false) => {
    if (submitting) return; 
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quiz_id: quizId, answers: answers })
      });
      const result = await res.json();
      
      if (res.ok) {
        // Dynamic notification matrix wrapper handles response indicators gracefully
        alert(`🎉 Assessment Processed!\nScore Summary Metrics: ${result.correct}/${result.total} (${result.score}%)`);
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

  const handleAutoSubmit = () => {
    console.warn("Countdown parameter expired boundary. Initializing automatic system submission layout logic.");
    handleSubmit(true);
  };

  if (loading) return <div className="tq-loading-splash">Compiling Cryptographic Testing Environment Elements...</div>;

  if (errorMsg) {
    return (
      <div className="tq-error-page-wrapper">
        <div className="tq-error-card">
          <div className="tq-error-icon">🛑</div>
          <h2 className="tq-error-title">Access Reference Blocked</h2>
          <p className="tq-error-disclaimer">{errorMsg}</p>
          <button onClick={() => navigate(-1)} className="back-btn tq-w-full">← Return to Previous Hub</button>
        </div>
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
          
          <div className={`tq-timer-box-indicator ${timeLeft < 60 ? 'tq-timer-state-urgent' : ''}`}>
            <span className="tq-hide-mobile">TIME REMAINING:</span>
            <span className="tq-timer-numerical-value">{formatTime(timeLeft)}</span>
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
    </div>
  );
};

export default TakeQuiz;