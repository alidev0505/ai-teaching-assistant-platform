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
    </div>
  );
};

export default LiveClasses;