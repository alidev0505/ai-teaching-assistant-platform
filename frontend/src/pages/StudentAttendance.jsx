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

  // ✅ STRUCTURAL REFACTOR: Replaced hardcoded HEX injection strings with clean semantic layout classes
  const getStatusClass = (pct) => {
    if (pct >= 75) return 'status-excellent'; // Secure threshold alignment
    if (pct >= 60) return 'status-warning';   // Approaching critical border conditions
    return 'status-critical';                 // Intervention target trigger bounds
  };

  if (loading) return <div className="sa-splash-text sa-gray-prompt">Syncing course attendance verification indexes...</div>;

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
    </div>
  );
};

export default StudentAttendance;