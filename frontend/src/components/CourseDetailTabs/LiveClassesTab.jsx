import React from 'react';

const LiveClassesTab = ({ liveSessions = [], setShowSessionModal, handleDeleteSession, user }) => {
  const sessions = liveSessions || [];

  return (
    <div className="lc-main-wrapper">
      {/* 1. Action Header Controls */}
      {user?.role === 'teacher' && (
        <div className="lc-action-header">
          <button 
            onClick={() => setShowSessionModal(true)} 
            className="lc-btn-schedule"
          >
            📅 Schedule New Class
          </button>
        </div>
      )}

      {/* 2. Structured Real-time Feed Ledger */}
      {sessions.length === 0 ? (
        <div className="lc-empty-state-card">
          <div className="lc-empty-icon">📡</div>
          <h3 className="lc-empty-title">No Live Classes Found</h3>
          <p className="lc-empty-subtitle">
            {user?.role === 'teacher' 
              ? "You haven't scheduled any sessions for this specific course yet." 
              : "Your instructor has not scheduled any live sessions for this course yet."}
          </p>
        </div>
      ) : (
        sessions.map((session, index) => {
          const meetingUrl = session.link || session.meeting_link || session.join_url;
          const sessionId = session.id || `session-key-fallback-${index}`;

          return (
            <div key={sessionId} className="lc-session-card">
              <div className="lc-card-split-row">
                <div className="lc-info-block">
                  <div className="lc-badge-incoming">
                    Incoming Session
                  </div>
                  <h3 className="lc-session-title">
                    {session.title || "Untitled Virtual Session"}
                  </h3>
                  <p className="lc-timestamp-row">
                    📅 {session.start_time 
                      ? new Date(session.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                      : "Schedule timeframe pending"}
                  </p>
                </div>
                
                <div className="lc-action-button-group">
                  {/* ✅ UI/UX & SECURITY FIX: Patched standard target window execution flags cleanly */}
                  <a 
                    href={meetingUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`lc-btn-join ${!meetingUrl ? 'disabled' : ''}`}
                  >
                    {meetingUrl ? 'Join Now →' : 'Link Pending'}
                  </a>

                  {user?.role === 'teacher' && (
                    <button 
                      onClick={() => handleDeleteSession(session.id)} 
                      className="lc-btn-cancel"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LiveClassesTab;