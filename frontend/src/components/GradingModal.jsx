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

        setLoading(true);
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
        </div>
    );
};

export default GradingModal;