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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .sav-workspace-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; font-family: 'Inter', sans-serif; }
        .sav-loading-splash { padding: 100px 24px; text-align: center; color: #64748b; font-weight: 600; font-size: 1rem; }
        
        /* Header Block elements */
        .sav-header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-top: 10px; }
        .sav-main-title { font-size: 1.6rem; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
        
        .sav-btn-back { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .sav-btn-back:hover { background: #f8fafc; color: #0f172a; }
        
        /* Directives Instruction Cards Box */
        .sav-instructions-card-panel { background: #ffffff; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
        .sav-panel-label-header { font-size: 0.9rem; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.3px; }
        .sav-panel-body-desc { font-size: 0.95rem; color: #475569; line-height: 1.65; margin: 0; white-space: pre-wrap; }
        
        .sav-deadline-badge { width: fit-content; background: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; border: 1px solid #bfdbfe; }
        .sav-deadline-badge.expired-timeline-state { background: #fef2f2; color: #dc2626; border-color: #fca5a5; font-weight: 800; }
        .sav-banner-spacing { margin-bottom: -4px; }
        
        /* Upload Interaction Zone Panel */
        .sav-upload-interaction-zone { background: #ffffff; border: 1px solid #e2e8f0; border-left: 5px solid #4f46e5; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 14px; }
        .sav-upload-label-string { font-weight: 700; color: #1e293b; font-size: 0.925rem; }
        .sav-upload-controls-flex-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
        .sav-file-raw-input-field { flex: 1; min-width: 240px; font-size: 0.875rem; color: #475569; }
        
        .sav-btn-submit-grade { background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(79,70,229,0.2); transition: all 0.2s; white-space: nowrap; }
        .sav-btn-submit-grade:hover:not(:disabled) { background-color: #4338ca; }
        .sav-btn-submit-grade:disabled { background-color: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }
        
        /* Graded Verification Success Screen & Pending States */
        .sav-results-display-zone { display: flex; flex-direction: column; gap: 24px; }
        
        .sav-review-pending-dashed-box { padding: 48px 24px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 14px; text-align: center; }
        .sav-pending-art-icon { font-size: 3rem; margin-bottom: 12px; line-height: 1; animation: sav-spin-slow 4s linear infinite; }
        .sav-pending-box-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.3px; }
        .sav-pending-box-subtitle { color: #64748b; font-size: 0.9rem; line-height: 1.5; max-width: 520px; margin: 0 auto 24px; font-weight: 500; }
        
        .sav-hidden-metrics-row-strip { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .sav-masked-pill-badge { background: #f1f5f9; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; border: 1px solid #cbd5e1; }
        
        /* Scoreboard Cards Row */
        .sav-graded-verified-success-panel { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 20px; }
        .sav-graded-panel-title { font-size: 1.2rem; font-weight: 800; color: #166534; margin: 0; letter-spacing: -0.3px; }
        
        .sav-stats-metric-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; width: 100%; }
        .sav-stat-node-box { background: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; }
        .box-accent-border-blue { border-top: 4px solid #3b82f6; }
        .box-accent-border-emerald { border-top: 4px solid #10b981; }
        .box-accent-border-red { border-top: 4px solid #ef4444; }
        
        .sav-stat-node-label { font-size: 0.725rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .sav-stat-node-integer { font-size: 2rem; font-weight: 900; line-height: 1; margin: 4px 0; }
        .text-accent-color-blue { color: #2563eb; }
        .text-accent-color-emerald { color: #059669; }
        .text-accent-color-red { color: #dc2626; }
        .sav-stat-node-subtext { font-size: 0.75rem; color: #64748b; font-weight: 500; line-height: 1.3; }
        
        /* Faculty Review Statement Content */
        .sav-instructor-feedback-panel-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px; }
        .sav-feedback-panel-header { font-size: 0.825rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.3px; }
        .sav-feedback-panel-body-text { margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.6; font-style: italic; }
        
        .sav-btn-resubmit-clear-toggle { width: fit-content; margin: 0 auto; background: none; border: none; color: #4f46e5; font-weight: 700; font-size: 0.9rem; cursor: pointer; text-decoration: underline; padding: 6px 12px; border-radius: 6px; transition: color 0.15s; }
        .sav-btn-resubmit-clear-toggle:hover { color: #3830a3; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        
        @keyframes sav-spin-slow { to { transform: rotate(360deg); } }
        
        @media (max-width: 680px) {
          .sav-upload-controls-flex-row { flex-direction: column; align-items: stretch; gap: 12px; }
          .sav-file-raw-input-field { width: 100%; }
          .sav-btn-submit-grade { width: 100%; text-align: center; }
          .sav-header-row { flex-direction: column; gap: 14px; text-align: center; }
          .sav-btn-back { width: 100%; text-align: center; }
          .sav-stats-metric-dashboard-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

// ─── DECOUPLED CHILD COMPONENT ───
const StatBox = ({ label, value, variant, sub }) => (
  <div className={`sav-stat-node-box box-accent-border-${variant}`}>
    <div className="sav-stat-node-label">{label}</div>
    <div className={`sav-stat-node-integer text-accent-color-${variant}`}>{value}</div>
    {sub && <div className="sav-stat-node-subtext">{sub}</div>}
  </div>
);

export default StudentAssignmentView;