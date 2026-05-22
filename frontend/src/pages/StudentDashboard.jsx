import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveSemesters, getStudentSemesterCourses, enrollInCourse, getStudentAnalytics, searchCourseByCode } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

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
      setPendingQuizzes(results.flat());
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
    <div className="st-page-wrapper">
      
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
    </div>
  );
};

export default StudentDashboard;