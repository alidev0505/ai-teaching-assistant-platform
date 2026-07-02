import React, { useState, useEffect, useContext } from 'react';
import { getAllLiveSessions, createLiveSession, getCourses, deleteLiveSession } from '../services/api'; 
import { AuthContext } from '../context/AuthContext';

const LiveClasses = () => {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [formData, setFormData] = useState({ course_id: '', title: '', start_time: '', meeting_link: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const sessRes = await getAllLiveSessions();
      setSessions(sessRes?.data?.sessions || []); 
      
      if (user?.role === 'teacher') {
        const courseRes = await getCourses();
        setCourses(courseRes?.data?.courses || []);
      }
    } catch (err) { 
      console.error("Live Class synchronous load error:", err); 
      setError("Failed to synchronize active lecture schedules from database.");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await createLiveSession(formData);
      setSuccess('🚀 Virtual classroom scheduled successfully and student feeds updated!');
      setFormData({ course_id: '', title: '', start_time: '', meeting_link: '' });
      loadData();
    } catch (err) { 
      setError('Scheduling Failure: Stalled broadcasting classroom configuration parameters.'); 
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this live session?")) return;
    setError('');
    setSuccess('');
    
    try {
        await deleteLiveSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
        setSuccess('Live session successfully de-indexed and removed from schedules.');
    } catch (err) {
        console.error(err);
        setError("Failed to remove active session reference parameters from the ledger.");
    }
  };

  return (
    <div className="lv-page-wrapper">

      {/* ── 1. HERO BANNER HEADER CONSOLE ── */}
      <header className="lv-hero-banner">
        <div className="lv-grid-mesh" />
        <div className="lv-hero-container">
          <h1 className="lv-hero-main-title">Live Virtual Classrooms</h1>
          <p className="lv-hero-subtitle">Coordinate and link with your cohort using high-fidelity real-time streaming modules.</p>
        </div>
      </header>
      
      <div className="lv-content-workspace">

        {error && <div className="auth-alert error lv-spaced-banner">⚠️ {error}</div>}
        {success && <div className="auth-alert success lv-spaced-banner">✅ {success}</div>}

        {/* ── 2. TEACHER INSTRUCTOR SCHEDULING CARD CORE ── */}
        {user?.role === 'teacher' && (
          <div className="lv-schedule-form-card">
            <div className="lv-card-header-flex-row">
              <div className="lv-card-icon-avatar">📅</div>
              <div className="lv-card-title-header-block">
                <h3 className="lv-card-inner-title">Schedule Live Workspace</h3>
                <p className="lv-card-inner-subtitle">Distribute push-notifications across student endpoints instantaneously.</p>
              </div>
            </div>

            <form onSubmit={handleSchedule} className="lv-grid-form-layout">
              <div className="lv-form-group-full-width">
                <label className="lv-input-form-label">Target Curriculum Course</label>
                <select 
                  onChange={e => setFormData({...formData, course_id: e.target.value})}
                  value={formData.course_id}
                  className="rp-input-field select-cursor-pointer"
                  required
                >
                  <option value="">-- Select Active Syllabus Channel --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.class_code || c.code})</option>)}
                </select>
              </div>

              <div className="auth-form-group">
                <label className="lv-input-form-label">Class Lecture Topic</label>
                <input 
                  placeholder="e.g., Chapter 4: RAG Optimizations" 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  value={formData.title}
                  className="rp-input-field"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="lv-input-form-label">Streaming Meeting URL Bridge</label>
                <input 
                  type="url"
                  placeholder="e.g., Zoom, Microsoft Teams, or Google Meet link" 
                  onChange={e => setFormData({...formData, meeting_link: e.target.value})}
                  value={formData.meeting_link}
                  className="rp-input-field"
                />
              </div>

              <div className="lv-form-group-mobile-full-width">
                <label className="lv-input-form-label">Session Initialization Date & Time</label>
                <input 
                  type="datetime-local" 
                  onChange={e => setFormData({...formData, start_time: e.target.value})}
                  value={formData.start_time}
                  className="rp-input-field font-family-inherit-override"
                  required
                />
              </div>

              <div className="lv-form-group-full-width padding-top-micro">
                <button type="submit" className="btn-primary lv-btn-schedule-submit">
                  Schedule Session & Alert Cohort Roster 🚀
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── 3. UPCOMING LECTURES ROW SUMMARY ── */}
        <h3 className="lv-section-main-heading">Upcoming Scheduled Sessions</h3>

        {loading ? (
            <p className="lv-loading-placeholder-text">Syncing virtual calendar matrix rosters...</p>
        ) : sessions.length === 0 ? (
            <div className="lv-empty-workspace-state-box">
                <div className="lv-empty-box-art">📭</div>
                <h3 className="lv-empty-box-title">No virtual classes listed</h3>
                {user?.role === 'teacher' && <p className="lv-empty-box-subtitle">Utilize the scheduling matrix engine console card above to initialize your first live channel lecture.</p>}
            </div>
        ) : (
            <div className="lv-sessions-cards-grid-matrix">
              {sessions.map(s => (
              <div key={s.id} className="sa-attendance-card lv-custom-session-card">
                <div className="sa-card-header-row margin-bottom-small">
                  <span className="sa-class-code-pill lv-live-status-pill-indicator">
                    <span className="lv-blinking-status-dot"></span>
                    LIVE STREAM CHANNEL
                  </span>
                  <span className="rt-badge rt-badge-quiz">{s.course_code || 'Syllabus Code'}</span>
                </div>

                <h3 className="sa-course-card-title lv-session-header-title">{s.title}</h3>
                
                <div className="lv-itemized-metadata-display-box">
                    <p className="lv-metadata-paragraph-text"><strong>Syllabus Channel:</strong> {s.course_name}</p>
                    <p className="lv-metadata-paragraph-text text-highlight-blue">
                      📅 {new Date(s.start_time).toLocaleString(undefined, { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                    </p>
                </div>
                
                <div className="sa-mini-split-stats-grid padding-top-small">
                    <a href={s.meeting_link} target="_blank" rel="noreferrer" className="lc-btn-join text-decoration-none-override">
                      Enter Live Space →
                    </a>
                    {user?.role === 'teacher' && (
                        <button onClick={() => handleDelete(s.id)} className="lc-btn-cancel">
                            Cancel
                        </button>
                    )}
                </div>
              </div>
              ))}
            </div>
        )}
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .lv-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .lv-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .lv-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .lv-hero-container { max-width: 1000px; margin: 0 auto; padding: 0 24px; position: relative; }
        .lv-hero-main-title { color: #ffffff; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .lv-hero-subtitle { color: rgba(255, 255, 255, 0.8); margin-top: 8px; font-size: 1rem; line-height: 1.4; }
        
        .lv-content-workspace { max-width: 1000px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }
        .lv-spaced-banner { margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        
        /* Scheduling Form Panel Styles */
        .lv-schedule-form-card { background: #ffffff; padding: 30px; border-radius: 16px; border-left: 6px solid #4f46e5; box-shadow: 0 10px 25px rgba(0,0,0,0.04); border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; box-sizing: border-box; }
        .lv-card-header-flex-row { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
        .lv-card-icon-avatar { background: #eff6ff; padding: 12px; border-radius: 10px; font-size: 1.5rem; color: #4f46e5; line-height: 1; }
        .lv-card-title-header-block { display: flex; flex-direction: column; gap: 2px; }
        .lv-card-inner-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.3px; }
        .lv-card-inner-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; font-weight: 500; }
        
        .lv-grid-form-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .lv-form-group-full-width { grid-column: 1 / -1; }
        .lv-form-group-mobile-full-width { grid-column: auto; }
        .lv-input-form-label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.85rem; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
        .font-family-inherit-override { font-family: inherit !important; }
        .padding-top-micro { padding-top: 4px; }
        .lv-btn-schedule-submit { width: 100%; padding: 14px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); border: none; border-radius: 8px; background: #4f46e5; color: white; cursor: pointer; transition: all 0.2s; }
        .lv-btn-schedule-submit:hover { background: #4338ca; }
        
        /* Session List Presentation Section */
        .lv-section-main-heading { border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin: 40px 0 25px; color: #0f172a; font-weight: 800; font-size: 1.25rem; letter-spacing: -0.3px; }
        .lv-sessions-cards-grid-matrix { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr)); gap: 20px; }
        
        .lv-custom-session-card { background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 5px solid #ef4444 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; box-sizing: border-box; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .lv-custom-session-card:hover { transform: translateX(2px); box-shadow: 0 6px 12px -1px rgba(0, 0, 0, 0.08); }
        
        .sa-card-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .margin-bottom-small { margin-bottom: 12px !important; }
        .padding-top-small { padding-top: 14px !important; }
        
        .lv-live-status-pill-indicator { background: #fef2f2 !important; color: #dc2626 !important; font-weight: 800; font-size: 0.725rem !important; display: flex !important; align-items: center; gap: 6px; border: 1px solid #fca5a5; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; }
        .lv-blinking-status-dot { width: 6px; height: 6px; background: #dc2626; border-radius: 50%; animation: lv-pulse-dot-indicator 1s infinite alternate; }
        .rt-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.725rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .rt-badge-quiz { background: #dbeafe; color: #1e40af; }
        
        .lv-session-header-title { font-size: 1.15rem !important; margin: 0 0 12px 0 !important; letter-spacing: -0.2px; font-weight: 800; color: #0f172a; }
        .lv-itemized-metadata-display-box { display: flex; flex-direction: column; gap: 6px; flex-grow: 1; }
        .lv-metadata-paragraph-text { margin: 0; font-size: 0.875rem; color: #64748b; }
        .lv-metadata-paragraph-text.text-highlight-blue { color: #4f46e5 !important; font-weight: 700; }
        
        .sa-mini-split-stats-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; text-align: center; }
        .text-decoration-none-override { text-decoration: none !important; }
        
        .lc-btn-join { background: #10b981; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); display: inline-block; box-sizing: border-box; transition: background 0.2s ease; text-align: center; }
        .lc-btn-join:hover { background: #059669; }
        
        .lc-btn-cancel { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; box-sizing: border-box; transition: background 0.2s ease; }
        .lc-btn-cancel:hover { background: #fee2e2; }
        
        /* Empty States Fallbacks & Loading Prompts */
        .lv-empty-workspace-state-box { padding: 60px 24px; text-align: center; background: #ffffff; border-radius: 16px; border: 2px dashed #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.01); }
        .lv-empty-box-art { font-size: 3rem; margin-bottom: 14px; opacity: 0.4; line-height: 1; }
        .lv-empty-box-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
        .lv-empty-box-subtitle { color: #64748b; font-size: 0.875rem; margin: 0; line-height: 1.5; max-width: 440px; margin: 0 auto; }
        .lv-loading-placeholder-text { text-align: center; padding: 40px; color: #64748b; font-weight: 500; font-size: 0.95rem; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        @keyframes lv-pulse-dot-indicator { 0% { opacity: 0.4; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1.1); } }
        
        @media (max-width: 650px) {
          .lv-grid-form-layout { grid-template-columns: 1fr; }
          .lv-form-group-mobile-full-width { grid-column: 1 / -1; }
          .lv-hero-banner { text-align: center; padding-bottom: 80px; }
          .lv-content-workspace { margin-top: -40px; }
          .lv-custom-session-card { padding: 20px; }
          .sa-mini-split-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LiveClasses;