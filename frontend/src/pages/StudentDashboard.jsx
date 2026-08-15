import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveSemesters, getStudentSemesterCourses, enrollInCourse, getStudentAnalytics, searchCourseByCode } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [foundCourse, setFoundCourse] = useState(null);
  const [error, setError] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [modalSuccess, setModalSuccess] = useState('');

  useEffect(() => { 
    fetchSemesters(); 
    fetchStats(); 
  }, []);

  const fetchSemesters = async () => {
    try { 
      const res = await getActiveSemesters(); 
      setSemesters(res?.data?.semesters || []); 
    } catch (err) { 
      console.error("Semester fetch failed:", err); 
    }
  };

  const fetchPendingQuizzes = async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return; 
    const token = localStorage.getItem('token');
    try {
      const quizPromises = courseIds.map(id =>
        fetch(`${API_URL}/api/quiz/student/available-quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.ok ? res.json() : [])
      );
      const results = await Promise.all(quizPromises);
      const fetchedQuizzes = results.flat();
      setPendingQuizzes(fetchedQuizzes);
    } catch (err) { 
      console.error("Error fetching quizzes:", err); 
    }
  };

  const handleSemesterClick = async (sem) => {
    if (!sem || !sem.id) return; 
    setSelectedSemester(sem);
    try {
      const res = await getStudentSemesterCourses(sem.id);
      const coursesData = res?.data?.courses || [];
      setCourses(coursesData);
      fetchPendingQuizzes(coursesData.map(c => c.id));
    } catch (err) { 
      console.error("Course fetch failed:", err); 
      setCourses([]);
    }
  };

  const fetchStats = async () => {
    try { 
      const res = await getStudentAnalytics(); 
      setAnalytics(res?.data || null); 
    } catch (err) { 
      console.error("Stats fetch failed:", err); 
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setModalSuccess('');
    setFoundCourse(null);
    if (searchCode.trim().length < 4) return setError('Class enrollment codes must be at least 4 characters.');
    try { 
      const res = await searchCourseByCode(searchCode.trim()); 
      if (res?.data?.course) {
        setFoundCourse(res.data.course); 
      } else {
        setError('No active classroom space matched this code entry.');
      }
    } catch { 
      setError('Invalid class code signature vector. Please verify parameters.'); 
    }
  };

  const handleEnroll = async () => {
    setEnrollLoading(true);
    setError('');
    try {
      await enrollInCourse(searchCode.trim());
      setModalSuccess('Successfully enrolled in new course channel!');
      setFoundCourse(null); 
      setSearchCode(''); 
      setTimeout(() => {
        setShowEnrollModal(false);
        setModalSuccess('');
        if (selectedSemester) handleSemesterClick(selectedSemester);
        fetchStats();
      }, 2000);
    } catch (err) { 
      setError(err.response?.data?.error || 'Enrollment transaction failure occurred.'); 
    } finally { 
      setEnrollLoading(false); 
    }
  };

  const getSemesterChartData = () => {
    if (!analytics || !analytics.charts || !courses.length) return [];
    const names = courses.map(c => c.name);
    return analytics.charts.filter(d => names.includes(d.name));
  };

  return (
    <div className="std-page-wrapper">
      
      {/* ── HERO BANNER HEADER CONSOLE ── */}
      <div className="std-hero-banner">
        <div className="std-grid-mesh" />
        <div className="std-hero-container">
          <AnnouncementBanner />
          <div className="std-hero-header-row">
            <div className="std-hero-text-block">
              {selectedSemester && (
                <button onClick={() => setSelectedSemester(null)} className="std-btn-back">
                  ← All Semesters
                </button>
              )}
              <h1 className="std-hero-main-title">
                {selectedSemester ? selectedSemester.name : `Hello, ${user?.username?.split(' ')[0] || 'Student'} 👋`}
              </h1>
              <p className="std-hero-subtitle">
                {selectedSemester ? `${courses.length} enrolled active channels` : 'Select an active semester space to analyze your syllabus progress logs'}
              </p>
            </div>
            {selectedSemester && (
              <button onClick={() => { setError(''); setModalSuccess(''); setShowEnrollModal(true); }} className="std-btn-enroll">
                <span className="std-plus-sign">+</span> Join Class
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CORE OPERATIONS VIEWWORK STACK ── */}
      <div className="std-content-workspace">
        
        {/* ACTIVE SEMESTER ACADEMIC MATRIX GRID */}
        {!selectedSemester ? (
          <div className="std-semester-cards-grid">
            {semesters.map((sem) => (
              <div key={sem.id} onClick={() => handleSemesterClick(sem)} className="std-sem-card">
                <div className="std-sem-icon-avatar">📚</div>
                <h3 className="std-sem-card-title">{sem.name}</h3>
                <p className="std-sem-card-subtitle">Click to analyze courses</p>
                <span className="std-open-pill">Open Tracker →</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="std-semester-workspace-wrapper">
            
            {/* PERFORMANCE KPI COUNTER ROW */}
            <div className="std-stats-grid-row">
              {[
                { label: 'Enrolled Channels', value: courses.length, icon: '📚', variant: 'blue' },
                { label: 'Assignments Done', value: analytics?.total_completed || 0, icon: '✅', variant: 'emerald' },
                { label: 'Pending Tasks Matrix', value: analytics?.total_pending || 0, icon: '⏳', variant: 'amber' },
                { label: 'Syllabus Attendance', value: `${analytics?.avg_attendance || 0}%`, icon: '📅', variant: 'purple' },
              ].map(stat => (
                <div key={stat.label} className="std-stat-node-card">
                  <div className="std-stat-header-flex">
                    <div className={`std-stat-icon-badge stat-theme-${stat.variant}`}>{stat.icon}</div>
                    <span className="std-stat-label-string">{stat.label}</span>
                  </div>
                  <div className={`std-stat-integer-value text-color-${stat.variant}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* CRITICAL ACTIVE ASSESSMENTS NOTIFICATION DECK */}
            {pendingQuizzes.length > 0 && (
              <div className="std-assessments-alert-section">
                <h3 className="std-section-heading heading-border-red">Active Evaluations Pending 🚀</h3>
                <div className="std-assessment-listings-grid">
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} className="std-quiz-action-card">
                      <div className="std-quiz-info-block">
                        <span className="std-quiz-alert-tag">Evaluation Testing Assigned</span>
                        <h4 className="std-quiz-card-title">{quiz.title}</h4>
                        <div className="std-quiz-meta-row">
                          <span>⏱️ Allocation: {quiz.time_limit}m</span>
                          {quiz.deadline && <span className="std-quiz-deadline-text">⌛ Target Due: {new Date(quiz.deadline).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <button onClick={() => navigate(`/take-quiz/${quiz.id}`)} className="std-btn-start-quiz">Start Assessment</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPOSITE CHARTS PERFORMANCE VISUAL ROW */}
            <div className="std-visual-charts-flex-row">
              <div className="std-chart-container-card">
                <h3 className="std-chart-inner-title">Semester Progress Metrics</h3>
                <p className="std-chart-inner-subtitle">Assignment complete distributions calculated per course model channel</p>
                <div className="std-chart-canvas-box">
                  {getSemesterChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={getSemesterChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pending" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="std-chart-empty-placeholder">📊 Indexing parameters: No analytical data logged yet.</div>}
                </div>
              </div>

              <div onClick={() => navigate('/student/attendance')} className="std-attendance-promo-card">
                <div className="std-promo-art-logo">📅</div>
                <h3 className="std-promo-card-title">My Tracked Attendance</h3>
                <p className="std-promo-card-subtitle">Examine itemized logs verification statement report →</p>
              </div>
            </div>

            {/* CLASSROOM CHANNEL LISTS */}
            <h3 className="std-section-heading heading-border-blue">Enrolled Syllabus Classrooms</h3>
            <div className="std-course-cards-matrix-grid">
              {courses.length === 0 ? (
                <div className="std-empty-classroom-dashed-box">
                   <p>Your workspace portfolio registry has no recorded classes assigned this session.</p>
                   <button onClick={() => { setError(''); setModalSuccess(''); setShowEnrollModal(true); }} className="btn-primary std-empty-action-trigger-btn">Join a Class Channel</button>
                </div>
              ) : (
                courses.map((course, i) => {
                  const themeIndex = (i % 6) + 1;
                  return (
                    <div key={course.id} className={`std-course-item-card edge-theme-${themeIndex}`}>
                      <div className="std-course-card-inner-padding">
                        <div className="std-course-card-header-flex">
                          <h4 className="std-course-item-title">{course.name}</h4>
                          <span className="std-course-item-code-badge">{course.code || course.class_code}</span>
                        </div>
                        <p className="std-course-item-instructor">👤 Instructor: {course.teacher || course.teacher_name}</p>
                        <Link to={`/course/${course.id}`} className="std-btn-enter-classroom">Enter Classroom Space →</Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* ENROLL SYSTEM WORKSPACE OVERLAY INTERACTION LINK */}
      {showEnrollModal && (
        <div className="sm-overlay">
          <div className="sm-modal-card">
            <h2 className="sm-modal-title">Join a Classroom Channel</h2>
            <p className="std-modal-explainer-text">Submit the secure alphanumeric access key token distributed by your course tutor.</p>
            
            <form onSubmit={handleSearch}>
              <div className="std-modal-search-flex-row">
                <input placeholder="e.g., A7X9" value={searchCode} onChange={e => setSearchCode(e.target.value.toUpperCase())} className="std-modal-input-code" required />
                <button type="submit" className="std-modal-btn-search-trigger">Search Token</button>
              </div>
            </form>
            
            {error && <div className="auth-alert error modal-spaced-alert">⚠️ {error}</div>}
            {modalSuccess && <div className="auth-alert success modal-spaced-alert">✅ {modalSuccess}</div>}
            
            {foundCourse && !modalSuccess && (
              <div className="std-modal-found-entity-box">
                <div className="std-found-entity-title">{foundCourse.name}</div>
                <div className="std-found-entity-instructor">Faculty Guide: {foundCourse.teacher_name}</div>
                <button onClick={handleEnroll} disabled={enrollLoading} className="btn-primary std-modal-btn-confirm-enrollment">
                  {enrollLoading ? 'Verifying Link Ledger...' : 'Confirm Pipeline Enrollment'}
                </button>
              </div>
            )}
            <button onClick={() => { setShowEnrollModal(false); setFoundCourse(null); setSearchCode(''); setError(''); setModalSuccess(''); }} className="sm-btn-secondary std-modal-btn-close">Cancel Operation</button>
          </div>
        </div>
      )}

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .std-page-wrapper { background-color: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .std-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 90px; position: relative; overflow: hidden; }
        .std-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .std-hero-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }
        .std-hero-header-row { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; margin-top: 20px; }
        .std-hero-text-block { display: flex; flex-direction: column; gap: 4px; }
        
        .std-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 7px; cursor: pointer; font-size: 0.825rem; font-weight: 600; width: fit-content; margin-bottom: 8px; transition: background 0.2s; font-family: inherit; }
        .std-btn-back:hover { background: rgba(255, 255, 255, 0.18); }
        .std-hero-main-title { color: #ffffff; font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .std-hero-subtitle { color: rgba(255, 255, 255, 0.75); font-size: 0.95rem; margin: 0; font-weight: 500; }
        
        .std-btn-enroll { background-color: #ffffff; color: #1e3a8a; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: background 0.2s, transform 0.1s; display: flex; align-items: center; gap: 8px; font-family: inherit; }
        .std-btn-enroll:hover { background-color: #f8fafc; }
        .std-btn-enroll:active { transform: scale(0.98); }
        .std-plus-sign { font-size: 1.1rem; line-height: 1; font-weight: 800; }
        
        .std-content-workspace { max-width: 1200px; margin: -45px auto 0; padding: 0 24px; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 32px; box-sizing: border-box; }
        
        /* Semesters Entry Cards Hub Grid */
        .std-semester-cards-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(260px, 280px)); 
          gap: 24px; 
          width: 100%; 
          margin-top: 15px; 
        }
        
        .std-sem-card { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 16px; 
          padding: 32px; 
          text-align: center; 
          cursor: pointer; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 8px; 
          transition: transform 0.25s, box-shadow 0.25s; 
          max-width: 280px; /* Forces the compact square boundary */
        }
        .std-sem-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.05); border-color: #3b82f6; }
        .std-sem-icon-avatar { font-size: 2.2rem; background-color: #eff6ff; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #2563eb; margin-bottom: 8px; }
        .std-sem-card-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.3px; }
        .std-sem-card-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0; font-weight: 500; }
        .std-open-pill { font-size: 0.8rem; font-weight: 700; color: #2563eb; margin-top: 12px; }
        
        /* Inner Semester Workspace Area Layout structures */
        .std-semester-workspace-wrapper { display: flex; flex-direction: column; gap: 32px; width: 100%; animation: fadeIn 0.2s ease-out; }
        
        /* Status Metrics Dashboard Counters Nodes Row */
        .std-stats-grid-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; width: 100%; }
        .std-stat-node-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 20px 24px; border-radius: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; }
        .std-stat-header-flex { display: flex; align-items: center; gap: 12px; }
        .std-stat-icon-badge { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        
        .stat-theme-blue { background-color: #eff6ff; color: #2563eb; } .text-color-blue { color: #2563eb; }
        .stat-theme-emerald { background-color: #f0fdf4; color: #059669; } .text-color-emerald { color: #059669; }
        .stat-theme-amber { background-color: #fffbeb; color: #d97706; } .text-color-amber { color: #d97706; }
        .stat-theme-purple { background-color: #f5f3ff; color: #7c3aed; } .text-color-purple { color: #7c3aed; }
        
        .std-stat-label-string { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .std-stat-integer-value { font-size: 1.85rem; font-weight: 900; line-height: 1; }
        
        /* Live Evaluations Alert Notification deck stack */
        .std-assessments-alert-section { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; }
        .std-section-heading { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; padding-left: 12px; border-left: 4px solid transparent; letter-spacing: -0.3px; line-height: 1; }
        .heading-border-red { border-left-color: #ef4444; }
        .heading-border-blue { border-left-color: #2563eb; }
        
        .std-assessment-listings-grid { display: flex; flex-direction: column; gap: 12px; }
        .std-quiz-action-card { display: flex; justify-content: space-between; align-items: center; background-color: #fdf2f2; border: 1px solid #fca5a5; padding: 16px 20px; border-radius: 12px; flex-wrap: wrap; gap: 16px; box-sizing: border-box; }
        .std-quiz-info-block { display: flex; flex-direction: column; gap: 4px; }
        .std-quiz-alert-tag { font-size: 0.675rem; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; }
        .std-quiz-card-title { font-size: 1.05rem; font-weight: 800; color: #991b1b; margin: 0; letter-spacing: -0.2px; }
        .std-quiz-meta-row { display: flex; gap: 14px; font-size: 0.8rem; color: #7f1d1d; font-weight: 600; }
        .std-quiz-deadline-text { color: #dc2626; font-weight: 700; }
        
        .std-btn-start-quiz { background-color: #dc2626; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 10px rgba(220,38,38,0.2); transition: background 0.15s; font-family: inherit; }
        .std-btn-start-quiz:hover { background-color: #b91c1c; }
        
        /* Visual Display Graphs Row Stack */
        .std-visual-charts-flex-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: stretch; width: 100%; }
        .std-chart-container-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); display: flex; flex-direction: column; box-sizing: border-box; }
        .std-chart-inner-title { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.2px; }
        .std-chart-inner-subtitle { font-size: 0.775rem; color: #94a3b8; margin: 2px 0 16px 0; font-weight: 500; }
        .std-chart-canvas-box { width: 100%; height: 200px; flex-grow: 1; }
        .std-chart-empty-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.875rem; font-weight: 500; background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; box-sizing: border-box; }
        
        .std-attendance-promo-card { background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 32px; border-radius: 14px; color: #ffffff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; cursor: pointer; box-shadow: 0 8px 20px rgba(79,70,229,0.15); transition: transform 0.2s, box-shadow 0.2s; box-sizing: border-box; border: 1px solid rgba(255,255,255,0.05); }
        .std-attendance-promo-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(79,70,229,0.25); }
        .std-promo-art-logo { font-size: 2.8rem; margin-bottom: 12px; opacity: 0.9; line-height: 1; }
        .std-promo-card-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.3px; }
        .std-promo-card-subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.75); font-weight: 600; margin: 0; }
        
        /* Enrolled Classrooms Matrix grids cards */
        .std-course-cards-matrix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; width: 100%; }
        .std-course-item-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); box-sizing: border-box; position: relative; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .std-course-item-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
        .std-course-card-inner-padding { padding: 24px; display: flex; flex-direction: column; gap: 14px; height: 100%; box-sizing: border-box; }
        
        /* Classroom Card Vertical Edge Highlight Themes loops mappings */
        .std-course-item-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .std-course-item-card.edge-theme-1::before { background-color: #3b82f6; }
        .std-course-item-card.edge-theme-2::before { background-color: #10b981; }
        .std-course-item-card.edge-theme-3::before { background-color: #8b5cf6; }
        .std-course-item-card.edge-theme-4::before { background-color: #f59e0b; }
        .std-course-item-card.edge-theme-5::before { background-color: #ef4444; }
        .std-course-item-card.edge-theme-6::before { background-color: #0891b2; }
        
        .std-course-card-header-flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .std-course-item-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.2px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .std-course-item-code-badge { background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.72rem; letter-spacing: 0.3px; flex-shrink: 0; text-transform: uppercase; }
        .std-course-item-instructor { font-size: 0.85rem; color: #64748b; margin: 0; font-weight: 500; }
        
        .std-btn-enter-classroom { margin-top: auto; display: block; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-decoration: none; text-align: center; transition: all 0.15s; }
        .std-btn-enter-classroom:hover { background-color: #e2e8f0; color: #0f172a; border-color: #94a3b8; }
        
        .std-empty-classroom-dashed-box { grid-column: 1 / -1; padding: 48px 24px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 14px; text-align: center; color: #64748b; font-size: 0.9rem; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 14px; box-sizing: border-box; }
        .std-empty-action-trigger-btn { width: fit-content; padding: 10px 20px !important; font-size: 0.85rem !important; font-weight: 700; border-radius: 6px !important; }
        
        /* ── RECOVERED MODAL STRUCTURAL DESIGN MATRIX ── */
        .sm-overlay { position: fixed; inset: 0; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; box-sizing: border-box; animation: fadeIn 0.2s ease-out; }
        .sm-modal-card { background: #ffffff; border-radius: 16px; width: 100%; max-width: 500px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; box-sizing: border-box; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .sm-modal-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; text-align: center; margin: 0 0 8px 0; letter-spacing: -0.5px; }

        .std-modal-explainer-text { color: #64748b; font-size: 0.875rem; margin: 0 0 24px; text-align: center; line-height: 1.5; font-weight: 500; }
        .std-modal-search-flex-row { display: flex; gap: 12px; margin-bottom: 16px; width: 100%; box-sizing: border-box; }
        
        .std-modal-input-code { flex-grow: 1; padding: 12px 16px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 1rem; font-family: inherit; font-weight: 700; color: #0f172a; letter-spacing: 2px; outline: none; box-sizing: border-box; text-transform: uppercase; text-align: center; transition: border-color 0.15s; }
        .std-modal-input-code:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        
        .std-modal-btn-search-trigger { background-color: #1e293b; color: white; border: none; padding: 0 24px; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer; flex-shrink: 0; font-family: inherit; transition: background 0.15s; }
        .std-modal-btn-search-trigger:hover { background-color: #0f172a; }
        
        .sm-btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .sm-btn-secondary:hover { background: #e2e8f0; color: #0f172a; border-color: #cbd5e1; }

        .btn-primary { background: #2563eb; color: #ffffff; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; font-family: inherit; }
        .btn-primary:hover { background: #1d4ed8; }

        .modal-spaced-alert { margin-bottom: 16px !important; border-radius: 8px !important; }
        .std-modal-found-entity-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 10px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 4px; animation: scaleUp 0.15s ease-out; box-sizing: border-box; }
        .std-found-entity-title { font-weight: 800; color: #166534; font-size: 1.05rem; letter-spacing: -0.2px; }
        .std-found-entity-instructor { font-size: 0.85rem; color: #166534; font-weight: 600; margin-bottom: 12px; }
        
        .std-modal-btn-confirm-enrollment { width: 100%; font-size: 0.875rem !important; font-weight: 800; }
        .std-modal-btn-close { width: 100%; font-size: 0.875rem !important; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; text-align: left; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Smartphone adaptive structural layout adaptation selectors windows */
        @media (max-width: 860px) {
          .std-visual-charts-flex-row { grid-template-columns: 1fr; }
          .std-hero-header-row { flex-direction: column; text-align: center; align-items: center; gap: 16px; }
          .std-btn-enroll { width: 100%; justify-content: center; }
          .std-content-workspace { margin-top: -35px; }
          .std-modal-search-flex-row { flex-direction: column; }
          .std-modal-btn-search-trigger { padding: 12px; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;