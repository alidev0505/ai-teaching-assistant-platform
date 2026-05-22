import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentDetail } from '../services/api'; 
import api from '../services/api'; 

const StudentAssignmentView = ({ assignmentId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const activeId = assignmentId || params.id; 

  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const isPastDeadline = assignment?.deadline ? new Date() > new Date(assignment.deadline) : false;

  useEffect(() => {
    if (activeId) {
      loadAssignmentDetail();
    }
  }, [activeId]);

  const loadAssignmentDetail = async () => {
    try {
      const res = await getAssignmentDetail(activeId);
      setAssignment(res?.data || null);
      
      if (res?.data?.my_submission) {
        setResult({
          is_published: res.data.my_submission.is_published,
          grade: res.data.my_submission.grade,
          marks: res.data.my_submission.marks,
          ai_detection: res.data.my_submission.ai_score,
          plagiarism: res.data.my_submission.plagiarism_score,
          feedback: res.data.my_submission.feedback
        });
      }
    } catch (err) {
      console.error("Assignment detail retrieval error:", err);
      setError("Failed to retrieve assignment reference documentation parameters.");
    }
  };

  const handleSubmitFile = async () => {
    setError('');
    if (!file) return setError("Validation error: Please select a valid document payload path (PDF or DOCX).");
    if (isPastDeadline) return setError("Submission window locked: The assignment deadline parameter has passed.");

    setLoading(true);
    
    const formData = new FormData();
    formData.append('assignment_id', activeId);
    formData.append('file', file); 

    try {
      const res = await api.post('/content/assignment/submit-and-grade', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res?.data || null); 
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError("Submission processing failure payload mapping: " + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) return <div className="sav-loading-splash">Loading Assignment Details Reference Workspace...</div>;

  return (
    <div className="sav-workspace-container">
      {/* Structural Header Core */}
      <div className="sav-header-row">
        <h2 className="sav-main-title">{assignment.title}</h2>
        <button onClick={() => navigate(-1)} className="sav-btn-back">← Back</button>
      </div>
      
      {/* Instruction Prompt Summary Deck */}
      <div className="sav-instructions-card-panel">
        <strong className="sav-panel-label-header">📋 Assignment Directives & Parameters:</strong>
        <p className="sav-panel-body-desc">{assignment.description}</p>
        <div className={`sav-deadline-badge ${isPastDeadline ? 'expired-timeline-state' : ''}`}>
          {isPastDeadline ? '❌ Evaluation Target Window Closed' : `📅 Due Deadline: ${assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No Static Limit Set'}`}
        </div>
      </div>
      
      {error && (
        <div className="auth-alert error sav-banner-spacing">
          ⚠️ {error}
        </div>
      )}

      {/* Dynamic Workspace State Management Fork */}
      {!result ? (
        <div className="sav-upload-interaction-zone">
          <label className="sav-upload-label-string">
            Upload Complete Document Solution Matrix (PDF/DOCX Format):
          </label>
          <div className="sav-upload-controls-flex-row">
            <input 
              type="file" 
              accept=".pdf,.docx" 
              disabled={isPastDeadline}
              onChange={(e) => { setError(''); setFile(e.target.files[0]); }}
              className="sav-file-raw-input-field"
            />
            <button 
              onClick={handleSubmitFile} 
              disabled={loading || isPastDeadline}
              className="btn-primary sav-btn-submit-grade"
            >
              {loading ? 'Analyzing Vector Context...' : 'Submit & Auto-Grade 🚀'}
            </button>
          </div>
        </div>
      ) : (
        <div className="sav-results-display-zone">
          {!result.is_published ? (
            <div className="sav-review-pending-dashed-box">
              <div className="sav-pending-art-icon">⏳</div>
              <h3 className="sav-pending-box-title">Document Submission Under Evaluative Review</h3>
              <p className="sav-pending-box-subtitle">Your data payload has been successfully calculated and stored. System analytical summaries remain masked until published by your faculty guide.</p>
              <div className="sav-hidden-metrics-row-strip">
                <span className="sav-masked-pill-badge">🔒 AI Risk Index Hidden</span>
                <span className="sav-masked-pill-badge">🔒 Vector Plagiarism Hidden</span>
                <span className="sav-masked-pill-badge">🔒 Core Grading Scalar Hidden</span>
              </div>
            </div>
          ) : (
            <div className="sav-graded-verified-success-panel">
              <h3 className="sav-graded-panel-title">✅ Evaluation Complete & Verified</h3>
              <div className="sav-stats-metric-dashboard-grid">
                <StatBox label="Grade Allocation" value={result.grade} variant="blue" />
                <StatBox label="Marks Metric" value={result.marks} variant="blue" />
                <StatBox 
                  label="AI Generation Detection" 
                  value={`${result.ai_detection}%`} 
                  variant={result.ai_detection > 50 ? 'red' : 'emerald'} 
                  sub={result.ai_detection > 50 ? 'High Synthetic Distribution' : 'Highly Likely Human Originality'}
                />
                <StatBox 
                  label="Plagiarism Overlap Index" 
                  value={`${result.plagiarism}%`} 
                  variant={result.plagiarism > 50 ? 'red' : 'emerald'}
                  sub={result.plagiarism > 50 ? 'High Content Match Footprint' : 'Verified Original Document Content'}
                />
              </div>
              
              {result.feedback && (
                <div className="sav-instructor-feedback-panel-box">
                  <strong className="sav-feedback-panel-header">📢 Faculty Feedback Statement:</strong>
                  <p className="sav-feedback-panel-body-text">{result.feedback}</p>
                </div>
              )}
            </div>
          )}
          
          <button onClick={() => { setResult(null); setFile(null); setError(''); }} className="sav-btn-resubmit-clear-toggle">
            Re-submit Updated Document File
          </button>
        </div>
      )}
    </div>
  );
};

// ✅ DECOUPLED COMPONENT: Sub-metric cards optimized without internal template layout bindings
const StatBox = ({ label, value, variant, sub }) => (
  <div className={`sav-stat-node-box box-accent-border-${variant}`}>
    <div className="sav-stat-node-label">{label}</div>
    <div className={`sav-stat-node-integer text-accent-color-${variant}`}>{value}</div>
    {sub && <div className="sav-stat-node-subtext">{sub}</div>}
  </div>
);

export default StudentAssignmentView;