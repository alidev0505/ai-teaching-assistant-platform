import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const StudentAttendance = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/content/attendance/student/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data?.stats || []);
    } catch (err) {
      console.error("Failed to compile database attendance metrics records context.", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (pct) => {
    if (pct >= 75) return 'status-excellent'; // Secure threshold alignment
    if (pct >= 60) return 'status-warning';   // Approaching critical border conditions
    return 'status-critical';                 // Intervention target trigger bounds
  };

  if (loading) return (
    <div className="sa-loading-splash">
      <div className="sa-splash-text">Syncing course attendance verification indexes...</div>
      <style>{`
        .sa-loading-splash { min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .sa-splash-text { color: #64748b; font-weight: 600; font-size: 0.95rem; }
      `}</style>
    </div>
  );

  return (
    <div className="sa-page-wrapper">
      
      {/* ── 1. HERO BANNER HEADER CONSOLE ── */}
      <div className="sa-hero-banner">
        <div className="sa-grid-mesh" />
        <div className="sa-hero-container">
          <button onClick={() => navigate(-1)} className="sa-btn-back">
            ← Back to Portal Dashboard
          </button>
          <h1 className="sa-hero-main-title">My Tracked Attendance</h1>
          <p className="sa-hero-subtitle">Examine your presence and missing log criteria calculated across all enrolled courses channels.</p>
        </div>
      </div>

      {/* ── 2. MAIN SYSTEM CORE VIEWSPACE WORKSPACE ── */}
      <div className="sa-content-workspace">
        {stats.length === 0 ? (
          <div className="sa-empty-workspace-state">
            <div className="sa-empty-art-logo">📅</div>
            <h3 className="sa-empty-state-title">No session records logged</h3>
            <p className="sa-empty-state-subtitle">Attendance registers will list details here once active lectures are processed by your instructor guides.</p>
          </div>
        ) : (
          <div className="sa-cards-grid-matrix">
            {stats.map((course) => {
              const complianceClass = getStatusClass(course.percentage);
              return (
                <div key={course.course_id} className={`sa-attendance-card ${complianceClass}`}>
                  
                  {/* Course Details Block */}
                  <div className="sa-card-header-row">
                    <div className="sa-course-details-wrapper">
                      <h3 className="sa-course-card-title">{course.course_name}</h3>
                      <span className="sa-class-code-pill">{course.class_code}</span>
                    </div>
                  </div>

                  {/* Percentage Metric Presentation Ring */}
                  <div className="sa-percentage-center-box">
                    <span className="sa-percentage-integer-text">
                      {course.percentage}%
                    </span>
                    <div className="sa-percentage-scalar-label">Compliance Ratio</div>
                  </div>

                  {/* Operational Hardware Progress Rails */}
                  <div className="sa-progress-rail-container">
                    <div className="sa-progress-rail-fill" style={{ width: `${course.percentage}%` }} />
                  </div>

                  {/* Mini Segmented Ledger Elements Grid */}
                  <div className="sa-mini-split-stats-grid">
                    <div className="sa-mini-node stat-type-present">
                      <div className="sa-node-integer-value">{course.present}</div>
                      <div className="sa-node-string-label">Present</div>
                    </div>
                    <div className="sa-mini-node stat-type-absent">
                      <div className="sa-node-integer-value">{course.absent}</div>
                      <div className="sa-node-string-label">Absent</div>
                    </div>
                    <div className="sa-mini-node stat-type-total">
                      <div className="sa-node-integer-value">{course.total_sessions}</div>
                      <div className="sa-node-string-label">Total</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .sa-page-wrapper { background-color: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .sa-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .sa-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .sa-hero-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .sa-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; transition: background 0.2s ease; font-family: inherit; }
        .sa-btn-back:hover { background: rgba(255, 255, 255, 0.18); }
        
        .sa-hero-main-title { color: #ffffff; font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .sa-hero-subtitle { color: rgba(255, 255, 255, 0.8); margin-top: 8px; font-size: 0.95rem; line-height: 1.5; max-width: 600px; }
        
        .sa-content-workspace { max-width: 1100px; margin: -50px auto 0; padding: 0 24px; position: relative; z-index: 10; box-sizing: border-box; }
        
        /* Metric Grid Matrix Cards layout specifications */
        .sa-cards-grid-matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 24px; width: 100%; }
        
        .sa-attendance-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 28px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; position: relative; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .sa-attendance-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.04); }
        
        /* Left Vertical Color Strip Threshold Indication Markers */
        .sa-attendance-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
        .sa-attendance-card.status-excellent::before { background-color: #10b981; }
        .sa-attendance-card.status-warning::before { background-color: #f59e0b; }
        .sa-attendance-card.status-critical::before { background-color: #ef4444; }
        
        .sa-card-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .sa-course-details-wrapper { display: flex; flex-direction: column; gap: 4px; }
        .sa-course-card-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.3px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .sa-class-code-pill { background-color: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.5px; width: fit-content; }
        
        /* Interactive Center Presentation metrics details block */
        .sa-percentage-center-box { display: flex; flex-direction: column; align-items: center; text-align: center; margin: 8px 0; gap: 2px; }
        .sa-percentage-integer-text { font-size: 2.5rem; font-weight: 900; line-height: 1; letter-spacing: -1px; }
        
        .status-excellent .sa-percentage-integer-text { color: #10b981; }
        .status-warning .sa-percentage-integer-text { color: #d97706; }
        .status-critical .sa-percentage-integer-text { color: #dc2626; }
        
        .sa-percentage-scalar-label { font-size: 0.775rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Rail Bar Progress Layout Rules */
        .sa-progress-rail-container { height: 6px; background-color: #f1f5f9; border-radius: 100px; width: 100%; overflow: hidden; }
        .sa-progress-rail-fill { height: 100%; border-radius: 100px; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .status-excellent .sa-progress-rail-fill { background-color: #10b981; }
        .status-warning .sa-progress-rail-fill { background-color: #f59e0b; }
        .status-critical .sa-progress-rail-fill { background-color: #ef4444; }
        
        /* Segmented Ledger Nodes Grid Split Row */
        .sa-mini-split-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); background-color: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #f1f5f9; }
        .sa-mini-node { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; border-right: 1px solid #e2e8f0; }
        .sa-mini-node:last-child { border-right: none; }
        
        .sa-node-integer-value { font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .sa-mini-node.stat-type-present .sa-node-integer-value { color: #059669; }
        .sa-mini-node.stat-type-absent .sa-node-integer-value { color: #dc2626; }
        
        .sa-node-string-label { font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        
        /* Empty Fallbacks Layout Design */
        .sa-empty-workspace-state { padding: 60px 24px; text-align: center; background: #ffffff; border-radius: 16px; border: 2px dashed #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.01); max-width: 500px; margin: 20px auto 0; }
        .sa-empty-art-logo { font-size: 3rem; margin-bottom: 14px; opacity: 0.4; line-height: 1; }
        .sa-empty-state-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
        .sa-empty-state-subtitle { color: #64748b; font-size: 0.875rem; margin: 0; line-height: 1.5; }

        /* Smartphone adaptive structural adjustments shifters query */
        @media (max-width: 600px) {
          .sa-hero-banner { text-align: center; padding-bottom: 80px; }
          .sa-btn-back { width: 100%; text-align: center; }
          .sa-content-workspace { margin-top: -40px; padding: 0 16px; }
          .sa-attendance-card { padding: 20px; gap: 16px; }
        }
      `}</style>
    </div>
  );
};

export default StudentAttendance;