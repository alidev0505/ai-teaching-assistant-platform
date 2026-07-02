import React, { useState } from 'react';
import { publishGrade } from '../services/api';

const GradingModal = ({ submission, assignmentTitle, onClose, onSuccess }) => {
    const currentMarks = submission.obtained_marks !== undefined ? submission.obtained_marks : (submission.marks || 0);
    const [marks, setMarks] = useState(currentMarks);
    const [grade, setGrade] = useState(submission.grade || 'F');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handlePublish = async () => {
        setError('');
        setSuccessMsg('');

        const parsedMarks = parseFloat(marks);
        if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > 100) {
            setError('Validation Error: Target marks must reside strictly within a 0 to 100 range.');
            return;
        }

        loading(true);
        try {
            const payload = {
                submission_id: submission.id,
                marks: parsedMarks,
                grade: grade
            };
            
            await publishGrade(payload);
            setSuccessMsg('✨ Grade matrix published successfully!');
            
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1200);

        } catch (err) {
            console.error('Publish error context tracking:', err);
            const msg = err.response?.data?.error || err.message || 'Unknown network error';
            setError(`Failed to publish: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gm-overlay">
            <div className="gm-modal">
                {/* Header */}
                <div className="gm-header">
                    <div className="gm-header-title-group">
                        <h3 className="gm-title">Grading Worksheet</h3>
                        <span className="gm-subtitle">Student: {submission.student_name || 'Evaluation Target'}</span>
                    </div>
                    <button onClick={onClose} className="gm-close-btn">&times;</button>
                </div>

                <div className="gm-divider"></div>
                <p className="gm-context-label"><strong>Context Reference:</strong> {assignmentTitle}</p>

                {/* AI Analysis Deck */}
                <div className="gm-ai-section">
                    <h4 className="gm-ai-title">🤖 SmartTutor™ Metric Analytics</h4>
                    <div className="gm-stat-grid">
                        <div className="gm-stat-card">
                            <span className="gm-stat-label">AI Generation</span>
                            <strong className={`gm-stat-val ${submission.ai_score > 70 ? 'text-danger' : 'text-success'}`}>
                                {submission.ai_score || 0}%
                            </strong>
                        </div>
                        <div className="gm-stat-card">
                            <span className="gm-stat-label">Plagiarism Risk</span>
                            <strong className={`gm-stat-val ${submission.plagiarism_score > 40 ? 'text-danger' : 'text-success'}`}>
                                {submission.plagiarism_score || 0}%
                            </strong>
                        </div>
                        <div className="gm-stat-card">
                            <span className="gm-stat-label">Semantic Match</span>
                            <strong className="gm-stat-val text-primary">
                                {submission.similarity_score ? (submission.similarity_score * 100).toFixed(0) : 0}%
                            </strong>
                        </div>
                    </div>
                    <div className="gm-feedback-box">
                        <strong className="gm-feedback-heading">Automated Diagnostic Logs:</strong>
                        <p className="gm-feedback-text">{submission.feedback || "Structural criteria met cleanly. No anomalies detected."}</p>
                    </div>
                </div>

                {/* Manual Validation Matrix Form */}
                <div className="gm-form-row">
                    <div className="gm-form-group">
                        <label className="gm-form-label">Final Marks (0 - 100)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={marks}
                            onChange={e => setMarks(e.target.value)}
                            className="gm-input"
                        />
                    </div>

                    <div className="gm-form-group">
                        <label className="gm-form-label">Evaluated Grade</label>
                        <select value={grade} onChange={e => setGrade(e.target.value)} className="gm-select">
                            <option value="A+">A+</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                        </select>
                    </div>
                </div>

                {/* Notifications & Actions Footer */}
                <div className="gm-footer">
                    {error && <div className="gm-banner-error">⚠️ {error}</div>}
                    {successMsg && <div className="gm-banner-success">{successMsg}</div>}
                    
                    <div className="gm-action-group">
                        <button onClick={onClose} disabled={loading} className="gm-btn-cancel">Dismiss</button>
                        <button onClick={handlePublish} disabled={loading} className="gm-btn-publish">
                            {loading ? "Syncing Grid..." : "Publish Score"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── COMPONENT SELF-CONTAINED STYLES MATRIX ── */}
            <style>{`
                .gm-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3000;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .gm-modal {
                    background-color: #ffffff;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 520px;
                    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    border: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    padding: 28px;
                    animation: gm-scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .gm-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .gm-header-title-group {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .gm-title {
                    margin: 0;
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.025em;
                }

                .gm-subtitle {
                    font-size: 0.85rem;
                    color: #64748b;
                    font-weight: 600;
                }

                .gm-close-btn {
                    background: transparent;
                    border: none;
                    font-size: 1.75rem;
                    line-height: 1;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 0;
                    margin-top: -4px;
                    transition: color 0.15s;
                }

                .gm-close-btn:hover {
                    color: #475569;
                }

                .gm-divider {
                    height: 1px;
                    background-color: #f1f5f9;
                    margin: 16px 0;
                }

                .gm-context-label {
                    margin: 0 0 20px 0;
                    font-size: 0.9rem;
                    color: #334155;
                    line-height: 1.4;
                }

                /* RAG Pipeline Diagnostic Scores Grid */
                .gm-ai-section {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .gm-ai-title {
                    margin: 0 0 14px 0;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .gm-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .gm-stat-card {
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 12px;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .gm-stat-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .gm-stat-val {
                    font-size: 1.25rem;
                    font-weight: 900;
                    line-height: 1;
                }

                .text-success { color: #10b981; }
                .text-danger { color: #ef4444; }
                .text-primary { color: #2563eb; }

                .gm-feedback-box {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    margin-top: 4px;
                }

                .gm-feedback-heading {
                    font-size: 0.775rem;
                    font-weight: 700;
                    color: #334155;
                }

                .gm-feedback-text {
                    margin: 4px 0 0 0;
                    font-size: 0.85rem;
                    color: #475569;
                    line-height: 1.5;
                    font-style: italic;
                }

                /* Evaluation Inputs Controls */
                .gm-form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .gm-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .gm-form-label {
                    font-weight: 700;
                    color: #334155;
                    font-size: 0.825rem;
                }

                .gm-input, .gm-select {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    color: #0f172a;
                    background-color: #ffffff;
                    outline: none;
                    box-sizing: border-box;
                    font-family: inherit;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    height: 42px;
                }

                .gm-select {
                    cursor: pointer;
                }

                .gm-input:focus, .gm-select:focus {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                /* Footer Structure Alerts & Callouts */
                .gm-footer {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-top: auto;
                }

                .gm-banner-error, .gm-banner-success {
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    line-height: 1.4;
                    box-sizing: border-box;
                }

                .gm-banner-error {
                    background-color: #fef2f2;
                    color: #b91c1c;
                    border: 1px solid #fca5a5;
                }

                .gm-banner-success {
                    background-color: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .gm-action-group {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }

                .gm-btn-cancel, .gm-btn-publish {
                    padding: 11px 22px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.15s;
                    box-sizing: border-box;
                }

                .gm-btn-cancel {
                    background-color: #ffffff;
                    border: 1px solid #cbd5e1;
                    color: #475569;
                }

                .gm-btn-cancel:hover:not(:disabled) {
                    background-color: #f8fafc;
                    color: #0f172a;
                }

                .gm-btn-publish {
                    background-color: #4f46e5;
                    border: none;
                    color: #ffffff;
                    font-weight: 700;
                    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
                }

                .gm-btn-publish:hover:not(:disabled) {
                    background-color: #4338ca;
                }

                .gm-btn-cancel:disabled, .gm-btn-publish:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @keyframes gm-scale-up {
                    from { transform: scale(0.96); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                @media (max-width: 500px) {
                    .gm-modal { padding: 20px; }
                    .gm-form-row { grid-template-columns: 1fr; gap: 14px; }
                    .gm-stat-grid { grid-template-columns: 1fr; gap: 8px; }
                    .gm-action-group { flex-direction: column-reverse; gap: 10px; }
                    .gm-action-group button { width: 100%; text-align: center; }
                }
            `}</style>
        </div>
    );
};

export default GradingModal;