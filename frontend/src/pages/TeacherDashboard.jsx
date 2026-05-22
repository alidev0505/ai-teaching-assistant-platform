import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getActiveSemesters, getTeacherSemesterCourses, createCourse } from '../services/api';
import AnnouncementBanner from '../components/AnnouncementBanner';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => { 
    fetchSemesters(); 
  }, []);

  const fetchSemesters = async () => {
    try { 
      const res = await getActiveSemesters(); 
      setSemesters(res?.data?.semesters || []); 
    } catch (err) { 
      console.error("Failed to fetch current system semester periods.", err); 
    }
  };

  const handleSemesterClick = async (sem) => {
    setError('');
    setSelectedSemester(sem);
    try { 
      const res = await getTeacherSemesterCourses(sem.id); 
      setCourses(res?.data?.courses || []); 
    } catch (err) { 
      console.error("Failed to synchronize curriculum roster.", err); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedSemester) return;
    
    try {
      await createCourse({ ...newCourseData, semester_id: selectedSemester.id });
      setShowModal(false); 
      setNewCourseData({ name: '', description: '' });
      handleSemesterClick(selectedSemester);
    } catch (err) { 
      setError('Curriculum Error: Unable to create new channel instance.'); 
    }
  };

  return (
    <div className="td-page-wrapper">
      
      {/* ── HERO BANNER HEADER CONSOLE ── */}
      <div className="td-hero-banner">
        <div className="td-grid-mesh" />
        <div className="td-hero-container">
          <AnnouncementBanner />
          
          <div className="td-hero-header-row">
            <div className="td-hero-text-block">
              {selectedSemester && (
                <button onClick={() => setSelectedSemester(null)} className="td-btn-back">
                  ← All Semesters
                </button>
              )}
              <h1 className="td-hero-main-title">
                {selectedSemester ? selectedSemester.name : `Welcome, ${user?.username?.split(' ')[0] || 'Faculty'} 👋`}
              </h1>
              <p className="td-hero-subtitle">
                {selectedSemester ? `${courses.length} active courses configured` : 'Select an active semester space to handle your department curriculum'}
              </p>
            </div>
            {selectedSemester && (
              <button onClick={() => { setError(''); setShowModal(true); }} className="td-btn-create-course">
                <span className="td-plus-sign">+</span> Create Course
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CORE OPERATIONS VIEWWORK STACK ── */}
      <div className="td-content-workspace">
        {error && <div className="auth-alert error layout-spaced-banner">⚠️ {error}</div>}

        {/* ACTIVE SEMESTER SELECTION GRID BLOCK */}
        {!selectedSemester && (
          <div className="td-card-grid-matrix">
            {semesters.map((sem, i) => {
              const themeIndex = (i % 6) + 1;
              return (
                <div key={sem.id} onClick={() => handleSemesterClick(sem)} className="td-semester-card">
                  <div className={`td-sem-icon-avatar sem-theme-${themeIndex}`}>📅</div>
                  <h3 className="td-semester-card-title">{sem.name}</h3>
                  <p className="td-semester-card-subtitle">Click to view course listings</p>
                  <div className={`td-open-indicator-tag sem-theme-${themeIndex}`}>Open Workspace →</div>
                </div>
              );
            })}
            
            {semesters.length === 0 && (
              <div className="td-empty-workspace-state">
                <div className="td-empty-art-logo">📭</div>
                <h3 className="td-empty-state-title">No Active Semesters Found</h3>
                <p className="td-empty-state-subtitle">Please contact system Administration to initialize active session workspaces.</p>
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE COURSE ROSTER DECK LISTINGS */}
        {selectedSemester && (
          <div className="td-card-grid-matrix">
            {courses.length === 0 ? (
              <div className="td-empty-workspace-state state-border-dashed">
                <div className="td-empty-art-logo">📂</div>
                <h3 className="td-empty-state-title">No courses configured yet</h3>
                <p className="td-empty-state-subtitle">Initialize your first syllabus course link to connect your class pipeline.</p>
                <button onClick={() => setShowModal(true)} className="btn-primary td-empty-state-action-btn">Create Course</button>
              </div>
            ) : (
              courses.map((course, i) => {
                const themeIndex = (i % 6) + 1;
                return (
                  <div key={course.id} className={`td-course-card edge-color-${themeIndex}`}>
                    <div className="td-course-inner-body">
                      <div className="td-course-top-row">
                        <div className={`td-course-icon-badge course-theme-${themeIndex}`}>📚</div>
                        {course.code && <span className={`td-course-code-pill course-theme-${themeIndex}`}>{course.code}</span>}
                      </div>
                      <h3 className="td-course-card-title">{course.name}</h3>
                      <p className="td-course-card-desc">{course.description || 'No summary introduction cataloged.'}</p>
                      <div className="td-course-footer-row">
                        <span className="td-student-count-indicator">👥 {course.student_count || 0} Enrolled Students</span>
                        <Link to={`/course/${course.id}`} className={`td-btn-manage-link course-theme-${themeIndex}`}>Manage Workspace</Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── CREATE NEW COURSE MODAL OVERLAY CONSOLE ── */}
      {showModal && (
        <div className="sm-overlay">
          <div className="sm-modal-card">
            <h2 className="sm-modal-title">Create New Course</h2>
            <p className="td-modal-context-subtitle">Assigning target link to: <strong>{selectedSemester?.name}</strong></p>
            
            <form onSubmit={handleCreate} className="sm-form-container">
              <div className="sm-form-group">
                <label className="sm-form-label">Course Title Name</label>
                <input type="text" placeholder="e.g., Advanced Machine Learning" value={newCourseData.name} onChange={e => setNewCourseData({ ...newCourseData, name: e.target.value })} className="sm-input" required />
              </div>
              <div className="sm-form-group">
                <label className="sm-form-label">Course Description Abstract</label>
                <textarea placeholder="Provide an optional summary overview structural curriculum roadmap..." value={newCourseData.description} onChange={e => setNewCourseData({ ...newCourseData, description: e.target.value })} className="sm-input sm-textarea" />
              </div>
              <div className="sm-action-row">
                <button type="button" onClick={() => setShowModal(false)} className="sm-btn-secondary">Cancel</button>
                <button type="submit" className="sm-btn-primary">Create Course Space</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;