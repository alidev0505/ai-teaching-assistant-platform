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
        <div className="lc-feed-deck">
          {sessions.map((session, index) => {
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
          })}
        </div>
      )}

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .lc-main-wrapper {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: lc-fadeIn 0.2s ease-out;
        }

        /* Instructor Actions Bar */
        .lc-action-header {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .lc-btn-schedule {
          background-color: #4f46e5;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.15);
          transition: background-color 0.15s, transform 0.1s;
        }

        .lc-btn-schedule:hover {
          background-color: #4338ca;
        }

        .lc-btn-schedule:active {
          transform: scale(0.98);
        }

        /* Feed Deck List Matrix */
        .lc-feed-deck {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .lc-session-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-left: 5px solid #ef4444;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 4px rgb(0 0 0 / 0.01);
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .lc-session-card:hover {
          transform: translateX(2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .lc-card-split-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .lc-info-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 240px;
        }

        .lc-badge-incoming {
          width: fit-content;
          background-color: #fef2f2;
          color: #dc2626;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.725rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid #fca5a5;
        }

        .lc-session-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .lc-timestamp-row {
          margin: 0;
          font-size: 0.875rem;
          color: #4f46e5;
          font-weight: 700;
        }

        /* Action Controls Buttons Interfaced Group */
        .lc-action-button-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .lc-btn-join {
          background-color: #10b981;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
          transition: background-color 0.15s;
          height: 40px;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .lc-btn-join:hover:not(.disabled) {
          background-color: #059669;
        }

        .lc-btn-join.disabled {
          background-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .lc-btn-cancel {
          background-color: #ffffff;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 0 16px;
          height: 40px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.15s;
          box-sizing: border-box;
        }

        .lc-btn-cancel:hover {
          background-color: #fef2f2;
        }

        /* Empty Roster Feed Fallback Card Layout */
        .lc-empty-state-card {
          padding: 60px 24px;
          background-color: #ffffff;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          text-align: center;
          box-sizing: border-box;
          max-width: 500px;
          width: 100%;
          margin: 20px auto 0;
        }

        .lc-empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          opacity: 0.4;
          line-height: 1;
        }

        .lc-empty-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .lc-empty-subtitle {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
          font-weight: 500;
        }

        @keyframes lc-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Smartphone Adaptive Handshakers shifters */
        @media (max-width: 640px) {
          .lc-card-split-row {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .lc-action-button-group {
            width: 100%;
          }
          .lc-btn-join, .lc-btn-cancel {
            flex: 1;
            width: 100%;
            text-align: center;
          }
          .lc-session-card {
            padding: 20px;
          }
          .lc-session-title {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveClassesTab;