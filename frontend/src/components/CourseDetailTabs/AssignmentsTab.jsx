import React from 'react';
import { Link } from 'react-router-dom';

const AssignmentsTab = ({ 
  user, 
  assignments = [], 
  quizzes = [], 
  newAssign = { title: '', deadline: '', description: '', teacher_solution: '' }, 
  setNewAssign, 
  handleCreateAssignment, 
  handlePublishQuiz, 
  handleDeleteAssignment, 
  setSolutionFile, 
  viewingSubmissionsFor, 
  fetchSubmissions, 
  setActiveAssignmentId 
}) => (
  <div className="at-wrapper">
    
    {/* --- Teacher Assignment Builder Panel --- */}
    {user?.role === 'teacher' && (
      <div className="at-creation-card">
        <h3 className="at-section-title">📝 Create New Assignment</h3>
        <form onSubmit={handleCreateAssignment} className="at-form">
          <div className="at-form-row-grid">
            <div className="at-input-group">
              <label className="at-field-label">Assignment Title</label>
              <input 
                type="text"
                placeholder="e.g., Lab 3: Deep Learning RAG Implementation" 
                value={newAssign.title || ''} 
                onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} 
                required 
                className="at-input" 
              />
            </div>
            <div className="at-input-group">
              <label className="at-field-label">Cut-off Due Date</label>
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
              placeholder="Provide clean directives, rubric benchmarks, and parameter instructions..." 
              value={newAssign.description || ''} 
              onChange={e => setNewAssign({ ...newAssign, description: e.target.value })} 
              className="at-textarea" 
            />
          </div>
          
          <div className="at-solution-box">
            <label className="at-solution-label">🔑 Solution Key Configuration (Strict Required for Auto-Grading Framework):</label>
            <div className="at-file-upload-wrapper">
              <input 
                type="file" 
                accept=".pdf,.docx" 
                onChange={e => setSolutionFile(e.target.files?.[0] || null)} 
                className="at-file-input" 
              />
            </div>
            <textarea 
              placeholder="Alternative structural solution text framework coordinates..." 
              value={newAssign.teacher_solution || ''} 
              onChange={e => setNewAssign({ ...newAssign, teacher_solution: e.target.value })} 
              className="at-solution-textarea" 
            />
          </div>
          
          <button type="submit" className="at-btn-submit">Post Assignment Solution Matrix</button>
        </form>
      </div>
    )}

    {/* --- Quizzes Subsection Matrix --- */}
    <h3 className="at-main-heading">🧠 Assessments & Quizzes</h3>
    {quizzes.length === 0 ? (
      <div className="at-empty-card">No quiz modules generated for this course yet.</div>
    ) : (
      <div className="at-grid-layout">
        {quizzes.map(q => (
          <div key={q.id} className={`at-quiz-card ${q.is_published ? 'published' : 'draft'}`}>
            <div className="at-quiz-info">
              <h4 className="at-card-title">🧩 {q.title}</h4>
              <span className={`at-status-pill-badge ${q.is_published ? 'badge-published' : 'badge-draft'}`}>
                {q.is_published ? '● Active Live' : '○ Draft Modulus'}
              </span>
            </div>
            <div className="at-action-stack">
              {user?.role === 'teacher' ? (
                <>
                  {!q.is_published && (
                    <button onClick={() => handlePublishQuiz(q.id)} className="at-btn-assign">
                      Assign Now 🚀
                    </button>
                  )}
                  <Link to={`/quiz/${q.id}/view`} className="at-link-view">
                    View Results
                  </Link>
                </>
              ) : (
                q.is_published && (
                  <Link to={`/quiz/${q.id}/take`} className="at-link-action">
                    Start Quiz
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* --- Active Tasks Subsection --- */}
    <h3 className="at-main-heading">📋 Active Tasks</h3>
    {assignments.length === 0 ? (
      <div className="at-empty-card">No current active tasks posted for this course path.</div>
    ) : (
      <div className="at-list-layout">
        {assignments.map(a => (
          <div key={a.id} className="at-task-card">
            <div className="at-task-header">
              <h4 className="at-task-title">{a.title}</h4>
              {user?.role === 'teacher' && (
                <button onClick={() => handleDeleteAssignment(a.id)} className="at-btn-delete">
                  Delete
                </button>
              )}
            </div>
            
            <div className="at-task-body">
              {user?.role === 'student' && (
                <div className="at-student-status-box">
                  {a.my_submission ? (
                    <span className="at-status-badge-complete">✅ Submitted</span>
                  ) : (
                    <button onClick={() => setActiveAssignmentId(a.id)} className="at-btn-action-start">
                      Start Assignment 📝
                    </button>
                  )}
                </div>
              )}
              {user?.role === 'teacher' && (
                <button 
                  onClick={() => viewingSubmissionsFor === a.id ? null : fetchSubmissions(a.id)} 
                  className="at-btn-text-view"
                >
                  {viewingSubmissionsFor === a.id ? 'Viewing Records...' : 'View Submissions →'}
                </button>
              )}
            </div>
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

      /* Instructor Creation Layout Structure */
      .at-creation-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 28px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.01);
        margin-bottom: 24px;
        box-sizing: border-box;
      }

      .at-section-title {
        margin: 0 0 20px 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.025em;
      }

      .at-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .at-form-row-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .at-input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .at-field-label {
        font-weight: 700;
        color: #475569;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .at-input, .at-textarea, .at-solution-textarea {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.95rem;
        font-family: inherit;
        color: #0f172a;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s;
      }

      .at-input { height: 42px; padding: 0 14px; }
      .at-textarea { min-height: 90px; padding: 12px 14px; resize: vertical; }

      .at-input:focus, .at-textarea:focus, .at-solution-textarea:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }

      /* Solution Key Integration Module Box */
      .at-solution-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .at-solution-label {
        font-weight: 800;
        color: #334155;
        font-size: 0.825rem;
      }

      .at-file-upload-wrapper {
        padding: 4px 0;
      }

      .at-file-input {
        font-size: 0.85rem;
        color: #475569;
      }

      .at-solution-textarea {
        min-height: 70px;
        padding: 10px 12px;
        resize: vertical;
        font-size: 0.9rem;
        background-color: #ffffff;
      }

      .at-btn-submit {
        background-color: #4f46e5;
        color: #ffffff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        transition: background-color 0.15s, transform 0.1s;
        align-self: flex-start;
      }

      .at-btn-submit:hover { background-color: #4338ca; }
      .at-btn-submit:active { transform: scale(0.98); }

      /* Subheadings Framework Row Section */
      .at-main-heading {
        font-size: 1.15rem;
        font-weight: 800;
        color: #1e293b;
        margin: 24px 0 14px 0;
        letter-spacing: -0.02em;
      }

      /* Quiz Dashboard Configuration Grid */
      .at-grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        gap: 16px;
        margin-bottom: 8px;
      }

      .at-quiz-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 16px;
        box-sizing: border-box;
        transition: transform 0.15s ease;
      }

      .at-quiz-card:hover { transform: translateY(-2px); }
      .at-quiz-card.published { border-top: 4px solid #10b981; }
      .at-quiz-card.draft { border-top: 4px solid #94a3b8; }

      .at-quiz-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .at-card-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.4;
      }

      .at-status-pill-badge {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        width: fit-content;
      }

      .badge-published { color: #059669; }
      .badge-draft { color: #64748b; }

      /* Core Active Task Items Lists Arrays */
      .at-list-layout {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .at-task-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        box-sizing: border-box;
      }

      .at-task-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .at-task-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.01em;
      }

      /* Unified Action Buttons Deck Stack Module mappings */
      .at-action-stack {
        display: flex;
        gap: 10px;
        align-items: center;
        width: 100%;
      }

      .at-btn-assign, .at-link-view, .at-link-action, .at-btn-action-start, .at-btn-text-view {
        padding: 9px 14px;
        border-radius: 7px;
        font-weight: 700;
        font-size: 0.825rem;
        text-align: center;
        text-decoration: none;
        font-family: inherit;
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 36px;
      }

      .at-btn-assign, .at-link-action, .at-btn-action-start {
        background-color: #4f46e5;
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s;
      }

      .at-btn-assign:hover, .at-link-action:hover, .at-btn-action-start:hover { background-color: #4338ca; }

      .at-link-view, .at-btn-text-view {
        background-color: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s;
      }

      .at-link-view:hover, .at-btn-text-view:hover {
        background-color: #e2e8f0;
        color: #0f172a;
        border-color: #94a3b8;
      }

      .at-btn-delete {
        background: transparent;
        border: none;
        color: #ef4444;
        font-size: 0.825rem;
        font-weight: 700;
        cursor: pointer;
        padding: 2px 4px;
        width: fit-content;
        text-align: left;
      }

      .at-btn-delete:hover { text-decoration: underline; }

      .at-status-badge-complete {
        font-size: 0.875rem;
        font-weight: 700;
        color: #059669;
        background-color: #ecfdf5;
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #a7f3d0;
        display: inline-block;
      }

      /* Layout Fallback Prompt Cards */
      .at-empty-card {
        padding: 32px;
        text-align: center;
        color: #94a3b8;
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 500;
      }

      @keyframes at-fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Mobile Layout Adaptive Views Port */
      @media (max-width: 680px) {
        .at-form-row-grid { grid-template-columns: 1fr; gap: 14px; }
        .at-task-card { flex-direction: column; align-items: stretch; gap: 14px; padding: 18px; }
        .at-action-stack, .at-btn-submit { width: 100%; }
        .at-btn-submit { text-align: center; }
        .at-btn-assign, .at-link-view, .at-link-action, .at-btn-action-start, .at-btn-text-view { flex: 1; width: 100%; }
      }
    `}</style>
  </div>
);

export default AssignmentsTab;