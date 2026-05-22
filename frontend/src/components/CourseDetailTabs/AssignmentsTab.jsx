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
          <input 
            type="text"
            placeholder="Assignment Title" 
            value={newAssign.title || ''} 
            onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} 
            required 
            className="at-input" 
          />
          <input 
            type="datetime-local" 
            value={newAssign.deadline || ''} 
            onChange={e => setNewAssign({ ...newAssign, deadline: e.target.value })} 
            required 
            className="at-input" 
          />
          <textarea 
            placeholder="Instructions & Guidelines..." 
            value={newAssign.description || ''} 
            onChange={e => setNewAssign({ ...newAssign, description: e.target.value })} 
            className="at-textarea" 
          />
          
          <div className="at-solution-box">
            <label className="at-solution-label">🔑 Solution Key (REQUIRED for AI Grading):</label>
            <input 
              type="file" 
              accept=".pdf,.docx" 
              onChange={e => setSolutionFile(e.target.files?.[0] || null)} 
              className="at-file-input" 
            />
            <textarea 
              placeholder="Or paste solution text framework..." 
              value={newAssign.teacher_solution || ''} 
              onChange={e => setNewAssign({ ...newAssign, teacher_solution: e.target.value })} 
              className="at-solution-textarea" 
            />
          </div>
          
          <button type="submit" className="at-btn-submit">Post Assignment</button>
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
            <h4 className="at-card-title">🧩 {q.title}</h4>
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
  </div>
);

export default AssignmentsTab;