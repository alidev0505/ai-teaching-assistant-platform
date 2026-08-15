import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // 👈 ADDED THIS IMPORT TO FIX THE ERROR

const AssignmentsTab = ({ 
  user, 
  assignments = [], 
  quizzes = [], 
  submissions = [],
  newAssign = { title: '', deadline: '', description: '', teacher_solution: '' }, 
  setNewAssign, 
  assignFile,        
  setAssignFile,      
  handleCreateAssignment, 
  handlePublishQuiz, 
  handleDeleteAssignment, 
  setSolutionFile, 
  viewingSubmissionsFor, 
  fetchSubmissions, 
  handleDownload,
  setActiveAssignmentId 
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [publishingId, setPublishingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState({});
  // 👇 State to track manual grades typed by the teacher
  const [manualGrades, setManualGrades] = useState({});

  // 👇 Function to send the manual grade to the backend using Axios
  const handlePublishGrade = async (submissionId, originalGrade) => {
    const finalGrade = manualGrades[submissionId] !== undefined 
      ? manualGrades[submissionId] 
      : originalGrade;

    if (finalGrade === null || finalGrade === '') {
      alert('Please enter a valid grade before publishing.');
      return;
    }

    setPublishingId(submissionId);

    try {
      // 👇 Uses your configured Axios instance supporting local & production envs seamlessly
      const response = await api.post('/content/submission/publish', {
        submission_id: submissionId,
        marks: Number(finalGrade),
        grade: Number(finalGrade)
      });

      if (response.status === 200) {
        setSuccessMessage(prev => ({ ...prev, [submissionId]: '✓ Saved!' }));
        setTimeout(() => {
          setSuccessMessage(prev => ({ ...prev, [submissionId]: '' }));
        }, 3000);

        // Refresh the submissions list
        if (fetchSubmissions) fetchSubmissions(viewingSubmissionsFor);
      }
    } catch (error) {
      console.error("Failed to publish grade:", error);
      const errorMsg = error.response?.data?.error || "Failed to connect to the server.";
      alert(errorMsg); 
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="at-wrapper">
      
      {/* --- Teacher Assignment Builder Panel --- */}
      {user?.role === 'teacher' && (
        <div className="at-creation-card">
          <div className="at-creation-header" onClick={() => setShowCreateForm(!showCreateForm)}>
            <div className="at-header-left">
              <h3 className="at-section-title" style={{ margin: 0 }}>📝 Create New Assignment</h3>
              <p className="at-section-subtitle">Post tasks and configure the AI auto-grader.</p>
            </div>
            <button type="button" className={`at-btn-toggle-form ${showCreateForm ? 'cancel' : ''}`}>
              {showCreateForm ? '✕ Cancel' : '+ Create Assignment'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={(e) => { handleCreateAssignment(e); setShowCreateForm(false); }} className="at-form">
              <div className="at-form-section">
                <h4 className="at-step-heading"><span className="at-step-number">1</span> Assignment Details</h4>
                
                <div className="at-form-row-grid">
                  <div className="at-input-group">
                    <label className="at-field-label">Assignment Title *</label>
                    <input 
                      type="text"
                      placeholder="e.g., Lab 3: Deep Learning" 
                      value={newAssign.title || ''} 
                      onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} 
                      required 
                      className="at-input" 
                    />
                  </div>
                  <div className="at-input-group">
                    <label className="at-field-label">Due Date *</label>
                    <input 
                      type="datetime-local" 
                      value={newAssign.deadline || ''} 
                      onChange={e => setNewAssign({ ...newAssign, deadline: e.target.value })} 
                      required 
                      className="at-input" 
                    />
                  </div>
                </div>

                <div className="at-input-group">
                  <label className="at-field-label">Instructions & Guidelines</label>
                  <textarea 
                    placeholder="Explain what the students need to do..." 
                    value={newAssign.description || ''} 
                    onChange={e => setNewAssign({ ...newAssign, description: e.target.value })} 
                    className="at-textarea" 
                  />
                </div>

                <div className="at-input-group">
                  <label className="at-field-label">Attach Question File </label>
                  <div className="at-modern-file-upload">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.txt" 
                      onChange={e => setAssignFile(e.target.files?.[0] || null)} 
                      className="at-file-input" 
                    />
                  </div>
                </div>
              </div>

              <div className="at-form-section at-ai-section">
                <div className="at-ai-header">
                  <h4 className="at-step-heading"><span className="at-step-number ai-step">2</span> AI Auto-Grading Setup</h4>
                  <span className="at-required-badge">Required for AI</span>
                </div>
                <p className="at-solution-help">Provide the solution key or grading rubric. The AI will use this to automatically grade student submissions and provide feedback.</p>
                
                <div className="at-solution-split">
                  <div className="at-input-group">
                    <label className="at-field-label">Upload Solution File</label>
                    <div className="at-modern-file-upload ai-upload">
                      <input 
                        type="file" 
                        accept=".pdf,.docx,.txt" 
                        onChange={e => setSolutionFile(e.target.files?.[0] || null)} 
                        className="at-file-input" 
                      />
                    </div>
                  </div>
                  
                  <div className="at-or-divider">OR</div>

                  <div className="at-input-group">
                    <label className="at-field-label">Paste Text Rubric / Solution</label>
                    <textarea 
                      placeholder="Paste the correct answers or grading criteria here..." 
                      value={newAssign.teacher_solution || ''} 
                      onChange={e => setNewAssign({ ...newAssign, teacher_solution: e.target.value })} 
                      className="at-solution-textarea" 
                    />
                  </div>
                </div>
              </div>
              
              <button type="submit" className="at-btn-submit">Publish Assignment</button>
            </form>
          )}
        </div>
      )}

      {/* --- Quizzes Subsection Matrix --- */}
      <h3 className="at-main-heading">🧠 Assessments & Quizzes</h3>
      {quizzes.length === 0 ? (
        <div className="at-empty-card">No quizzes have been generated for this course yet.</div>
      ) : (
        <div className="at-grid-layout">
          {quizzes.map(q => (
            <div key={q.id} className={`at-quiz-card ${q.is_published ? 'published' : 'draft'}`} style={{ padding: '16px' }}>
              <div className="at-quiz-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h4 className="at-card-title" style={{ fontSize: '0.95rem' }}> {q.title}</h4>
                  <span className={`at-status-pill-badge ${q.is_published ? 'badge-published' : 'badge-draft'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {q.is_published ? '● Published' : '○ Draft'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
                  {q.time_limit && (
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                      ⏱️ Time Limit: {q.time_limit} Minutes
                    </span>
                  )}
                  {q.deadline && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>
                      ⏳ Due: {new Date(q.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="at-action-stack" style={{ marginTop: '12px' }}>
                {user?.role === 'teacher' ? (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    {!q.is_published && (
                      <button onClick={() => handlePublishQuiz(q.id)} className="at-btn-assign" style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}>
                        Assign Now 🚀
                      </button>
                    )}
                    <Link to={`/quiz/${q.id}/view`} className="at-link-view" style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}>
                      View Results
                    </Link>
                  </div>
                ) : (
                  q.is_published && (
                    (q.attempted === true || q.score != null || q.my_submission != null) ? (
                      <div style={{ width: '100%', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#065f46', background: '#d1fae5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                          Completed
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#059669' }}>
                          Score: {Number(q.score ?? q.my_submission?.score ?? q.my_submission?.grade ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <Link to={`/quiz/${q.id}/take`} className="at-link-action" style={{ width: '100%', textAlign: 'center', padding: '8px 12px', fontSize: '0.85rem' }}>
                        Start Quiz 📝
                      </Link>
                    )
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Active Tasks Subsection --- */}
      <h3 className="at-main-heading">📋 Active Assignments</h3>
      {assignments.length === 0 ? (
        <div className="at-empty-card">No assignments have been posted for this course.</div>
      ) : (
        <div className="at-list-layout">
          {assignments.map(a => (
            <div key={a.id} className="at-task-card">
              
              <div className="at-task-header">
                <div className="at-task-title-group">
                  <h4 className="at-task-title">{a.title}</h4>
                  {a.deadline && (
                    <span className="at-task-deadline">
                      ⏳ Due: {new Date(a.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
                {user?.role === 'teacher' && (
                  <button onClick={() => handleDeleteAssignment(a.id)} className="at-btn-delete">
                    Delete
                  </button>
                )}
              </div>
              
              <div className="at-task-details">
                {a.description && <p className="at-task-desc">{a.description}</p>}
                
                {a.file_path && (
                  <button 
                    onClick={() => handleDownload(a.file_path, `${a.title}_Question_File`)} 
                    className="at-btn-download-file"
                  >
                    📄 Download Question File
                  </button>
                )}
              </div>
              
              <div className="at-task-body">
                {user?.role === 'student' && (
                  <div className="at-student-status-box">
                    {a.my_submission ? (
                      <div className="at-student-result-summary">
                        <div className="at-student-result-header">
                          <span className="at-status-badge-complete">✅ Submitted</span>
                          {(!a.deadline || new Date() < new Date(a.deadline)) && (
                            <button onClick={() => setActiveAssignmentId(a.id)} className="at-btn-action-resubmit">
                              Resubmit 🔄
                            </button>
                          )}
                        </div>

                        {a.my_submission.grade !== null ? (
                          <div className="at-grade-display">
                            <span className="at-score-highlight">Score: {Math.min(Number(a.my_submission.grade), 100)}/100</span>
                            {a.my_submission.feedback && <p className="at-ai-feedback"><strong>AI Feedback:</strong> {a.my_submission.feedback}</p>}
                          </div>
                        ) : (
                          <div className="at-grade-display">
                             <span className="at-score-pending">⏳ Pending AI Auto-Grading...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      (!a.deadline || new Date() < new Date(a.deadline)) ? (
                        <button onClick={() => setActiveAssignmentId(a.id)} className="at-btn-action-start">
                          Start Assignment 📝
                        </button>
                      ) : (
                        <span className="at-score-pending" style={{ color: '#dc2626' }}>❌ Deadline has passed</span>
                      )
                    )}
                  </div>
                )}

                {user?.role === 'teacher' && (
                  <button 
                    onClick={() => viewingSubmissionsFor === a.id ? fetchSubmissions(null) : fetchSubmissions(a.id)} 
                    className="at-btn-text-view"
                  >
                    {viewingSubmissionsFor === a.id ? 'Hide Submissions ↑' : 'View Submissions ↓'}
                  </button>
                )}
              </div>

              {/* --- TEACHER VIEW: Interactive Submissions Interface --- */}
              {user?.role === 'teacher' && viewingSubmissionsFor === a.id && (
                <div className="at-submissions-dropdown">
                  <h5 className="at-sub-heading">Student Submissions & Grading</h5>
                  {submissions.length === 0 ? (
                    <div className="at-empty-card" style={{padding: '16px'}}>No submissions received yet.</div>
                  ) : (
                    <div className="at-submissions-list">
                      {submissions.map(sub => (
                        <div key={sub.id} className="at-submission-item">
                          
                          <div className="at-sub-grade-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder={sub.grade !== null ? sub.grade : "0"}
                            value={manualGrades[sub.id] !== undefined ? manualGrades[sub.id] : (sub.grade || '')}
                            onChange={(e) => setManualGrades(prev => ({ ...prev, [sub.id]: e.target.value }))}
                            style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1rem' }}
                          />
                          <span style={{ fontWeight: 'bold', color: '#475569' }}>/ 100</span>
                          
                          <button 
                            onClick={() => {
                              const newGrade = manualGrades[sub.id] !== undefined ? manualGrades[sub.id] : sub.grade;
                              handlePublishGrade(sub.id, newGrade);
                            }}
                            disabled={publishingId === sub.id}
                            className="at-btn-assign"
                            style={{ 
                              padding: '6px 12px', 
                              height: 'auto',
                              fontSize: '0.8rem',
                              backgroundColor: sub.is_published ? '#0ea5e9' : '#10b981'
                            }}
                          >
                            {publishingId === sub.id ? 'Saving...' : (sub.is_published ? 'Update' : 'Publish')}
                          </button>

                          {/* Inline success feedback message */}
                          {successMessage[sub.id] && (
                            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>
                              {successMessage[sub.id]}
                            </span>
                          )}
                        </div>

                          {sub.file_path && (
                            <div className="at-sub-file-row">
                              <button 
                                type="button"
                                onClick={() => handleDownload(
                                  sub.file_path, 
                                  `${sub.student_name || sub.email || 'Student'}_ID-${sub.university_id || sub.student_id}_Submission`
                                )}
                                className="at-btn-download-file"
                              >
                                📥 Download Submitted Work
                              </button>
                            </div>
                          )}

                          {sub.feedback && <p className="at-sub-feedback"><strong>🤖 AI Feedback:</strong> {sub.feedback}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .at-wrapper {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          animation: at-fadeIn 0.2s ease-out;
        }

        .at-creation-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px 28px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.01);
          margin-bottom: 24px;
          box-sizing: border-box;
        }

        .at-creation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .at-section-subtitle { margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; }
        
        .at-form-section { background: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
        .at-ai-section { background: #f8fafc; border-color: #cbd5e1; border-left: 4px solid #4f46e5; }
        
        .at-step-heading { margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; }
        .at-step-number { background: #e2e8f0; color: #475569; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; }
        .at-step-number.ai-step { background: #4f46e5; color: #ffffff; }
        
        .at-ai-header { display: flex; justify-content: space-between; align-items: center; }
        .at-required-badge { background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .at-solution-help { margin: -8px 0 16px 0; font-size: 0.85rem; color: #475569; line-height: 1.5; }
        
        .at-modern-file-upload { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 16px; background: #f8fafc; transition: all 0.2s; }
        .at-modern-file-upload:hover { border-color: #4f46e5; background: #eff6ff; }
        .at-modern-file-upload.ai-upload { background: #ffffff; }
        .at-file-input { font-size: 0.85rem; color: #475569; width: 100%; cursor: pointer; }
        
        .at-solution-split { display: flex; flex-direction: column; gap: 16px; }
        .at-or-divider { text-align: center; font-weight: 800; color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; position: relative; }
        .at-or-divider::before, .at-or-divider::after { content: ''; position: absolute; top: 50%; width: 45%; height: 1px; background: #cbd5e1; }
        .at-or-divider::before { left: 0; }
        .at-or-divider::after { right: 0; }
        
        .at-btn-submit { width: 100%; padding: 14px; font-size: 1rem; margin-top: 8px; background-color: #4f46e5; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background-color 0.15s; }
        .at-btn-submit:hover { background-color: #4338ca; }

        .at-btn-toggle-form {
          background: #eff6ff;
          color: #2563eb;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .at-btn-toggle-form.cancel { background: #fef2f2; color: #dc2626; }
        .at-btn-toggle-form:hover { opacity: 0.8; }

        .at-section-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }

        .at-form { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 24px; }
        .at-form-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .at-input-group { display: flex; flex-direction: column; gap: 6px; }
        .at-field-label { font-weight: 700; color: #475569; font-size: 0.8rem; text-transform: uppercase; }

        .at-input, .at-textarea, .at-solution-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .at-input { height: 42px; padding: 0 14px; }
        .at-textarea { min-height: 90px; padding: 12px 14px; resize: vertical; }
        .at-solution-textarea { min-height: 70px; padding: 10px 12px; resize: vertical; }
        .at-input:focus, .at-textarea:focus, .at-solution-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

        .at-main-heading { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 24px 0 14px 0; }
        
        .at-grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 16px; margin-bottom: 8px; }

        .at-quiz-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          box-sizing: border-box;
          transition: transform 0.15s ease;
        }

        .at-quiz-card:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.03); }
        .at-quiz-card.published { border-top: 4px solid #10b981; }
        .at-quiz-card.draft { border-top: 4px solid #94a3b8; }

        .at-quiz-info { display: flex; flex-direction: column; gap: 4px; }
        .at-card-title { margin: 0; font-weight: 800; color: #0f172a; line-height: 1.4; }
        .at-status-pill-badge { font-weight: 800; text-transform: uppercase; width: fit-content; }
        .badge-published { color: #059669; }
        .badge-draft { color: #64748b; }

        .at-list-layout { display: flex; flex-direction: column; gap: 12px; }
        .at-task-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
        .at-task-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .at-task-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .at-task-title-group { display: flex; flex-direction: column; gap: 4px; }
        .at-task-deadline { font-size: 0.8rem; font-weight: 700; color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 4px; width: fit-content; }
        .at-task-details { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px dashed #e2e8f0; }
        .at-task-desc { font-size: 0.9rem; color: #475569; line-height: 1.5; margin: 0 0 12px 0; white-space: pre-wrap; }
        
        .at-btn-download-file { background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .at-btn-download-file:hover { background: #e2e8f0; }
        .at-score-pending { font-size: 0.85rem; font-weight: 700; color: #d97706; }

        .at-action-stack { display: flex; gap: 10px; align-items: center; width: 100%; }
        .at-btn-assign, .at-link-view, .at-link-action, .at-btn-action-start, .at-btn-text-view {
          padding: 9px 14px; border-radius: 7px; font-weight: 700; font-size: 0.825rem; text-align: center; text-decoration: none; font-family: inherit; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; height: 36px;
        }

        .at-student-result-summary { display: flex; flex-direction: column; gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .at-student-result-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; }
        .at-btn-action-resubmit { background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .at-btn-action-resubmit:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
        .at-grade-display { margin-top: 4px; }
        .at-score-highlight { font-weight: 800; color: #4f46e5; font-size: 1.1rem; }
        .at-ai-feedback { font-size: 0.85rem; color: #475569; margin: 8px 0 0 0; line-height: 1.5; background: #ffffff; padding: 10px; border-radius: 6px; border-left: 3px solid #4f46e5; }
        
        .at-submissions-dropdown { width: 100%; margin-top: 8px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; animation: at-fadeIn 0.2s ease-out; }
        .at-sub-heading { margin: 0 0 16px 0; font-size: 0.95rem; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
        .at-submissions-list { display: flex; flex-direction: column; gap: 12px; }
        .at-submission-item { background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; display: grid; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .at-sub-info { font-size: 0.9rem; color: #0f172a; }
        
        .at-sub-feedback { font-size: 0.85rem; color: #475569; margin: 0; padding-top: 10px; border-top: 1px solid #e2e8f0; line-height: 1.5; }

        .at-btn-assign, .at-link-action, .at-btn-action-start { background-color: #4f46e5; color: #ffffff; border: none; cursor: pointer; transition: background-color 0.15s; }
        .at-btn-assign:hover, .at-link-action:hover, .at-btn-action-start:hover { background-color: #4338ca; }
        .at-link-view, .at-btn-text-view { background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; cursor: pointer; transition: all 0.15s; }
        .at-link-view:hover, .at-btn-text-view:hover { background-color: #e2e8f0; border-color: #94a3b8; }
        .at-btn-delete { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #dc2626; font-size: 0.75rem; font-weight: 700; cursor: pointer; padding: 6px 12px; transition: background 0.15s; }
        .at-btn-delete:hover { background: #fee2e2; }

        .at-status-badge-complete { font-size: 0.875rem; font-weight: 700; color: #059669; background-color: #ecfdf5; padding: 6px 14px; border-radius: 6px; border: 1px solid #a7f3d0; display: inline-block; }
        .at-empty-card { padding: 32px; text-align: center; color: #64748b; background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; font-size: 0.9rem; font-weight: 600; }
        .at-sub-header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .at-sub-file-row { margin-top: 6px; }

        @keyframes at-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 680px) {
          .at-form-row-grid { grid-template-columns: 1fr; gap: 14px; }
          .at-task-card { padding: 16px; }
          .at-action-stack, .at-btn-submit { width: 100%; }
          .at-btn-submit { text-align: center; }
          .at-btn-assign, .at-link-view, .at-link-action, .at-btn-action-start, .at-btn-text-view { flex: 1; width: 100%; }
          .at-sub-header-row { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default AssignmentsTab;