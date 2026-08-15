import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveSemesters, getTeacherSemesterCourses, createCourse } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AnnouncementBanner from '../components/AnnouncementBanner';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // 👇 UPDATED: Expanded state to include Program, Shift, Catalog Code, and Semester Code
  const [newCourseData, setNewCourseData] = useState({ 
    name: '', 
    description: '',
    program: '',
    shift: 'Morning',
    course_catalog_code: '',
    semester_code: ''
  });
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
      // 👇 Reset form data back to defaults
      setNewCourseData({ 
        name: '', 
        description: '',
        program: '',
        shift: 'Morning',
        course_catalog_code: '',
        semester_code: ''
      });
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
                      
                      {/* --- METADATA TAGS BLOCK --- */}
                      <div className="td-course-meta-tags">
                        {course.course_catalog_code && (
                          <span className="td-meta-tag catalog-tag">
                            📖 {course.course_catalog_code}
                          </span>
                        )}

                        {course.program && (
                          <span className="td-meta-tag program-tag">
                            🏫 {course.program}
                          </span>
                        )}

                        {course.semester_code && (
                          <span className="td-meta-tag semester-code-tag">
                            🏷️ {course.semester_code}
                          </span>
                        )}

                        {course.shift && (
                          <span className="td-meta-tag shift-tag">
                            ⏱️ {course.shift === 'M' || course.shift === 'Morning' ? 'Morning' : course.shift === 'E' || course.shift === 'Evening' ? 'Evening' : course.shift}
                          </span>
                        )}
                      </div>
                      
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
          <div className="sm-modal-card" style={{ maxWidth: '520px' }}>
            <h2 className="sm-modal-title">Create New Course</h2>
            <p className="td-modal-context-subtitle">Assigning target link to: <strong>{selectedSemester?.name}</strong></p>
            
            <form onSubmit={handleCreate} className="sm-form-container">
              <div className="sm-form-group">
                <label className="sm-form-label">Course Title Name *</label>
                <input type="text" placeholder="e.g., Advanced Machine Learning" value={newCourseData.name} onChange={e => setNewCourseData({ ...newCourseData, name: e.target.value })} className="sm-input" required />
              </div>

              {/* 👇 NEW FIELDS GRID FOR IV, V & DEPARTMENT METRICS 👇 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="sm-form-group">
                  <label className="sm-form-label">Course Code / ID</label>
                  <input type="text" placeholder="e.g., CSC-401" value={newCourseData.course_catalog_code} onChange={e => setNewCourseData({ ...newCourseData, course_catalog_code: e.target.value })} className="sm-input" />
                </div>
                <div className="sm-form-group">
                  <label className="sm-form-label">Program</label>
                  <input type="text" placeholder="e.g., BS Artificial Intelligence" value={newCourseData.program} onChange={e => setNewCourseData({ ...newCourseData, program: e.target.value })} className="sm-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="sm-form-group">
                  <label className="sm-form-label">Semester / Section</label>
                  <input type="text" placeholder="e.g., VIII-A" value={newCourseData.semester_code} onChange={e => setNewCourseData({ ...newCourseData, semester_code: e.target.value })} className="sm-input" />
                </div>
                <div className="sm-form-group">
                  <label className="sm-form-label">Shift</label>
                  <select value={newCourseData.shift} onChange={e => setNewCourseData({ ...newCourseData, shift: e.target.value })} className="sm-input">
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
              {/* 👆 END OF NEW FIELDS GRID 👆 */}

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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .td-page-wrapper { background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        
        .td-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 90px 0; position: relative; overflow: hidden; }
        .td-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .td-hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .td-hero-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; gap: 20px; flex-wrap: wrap; }
        .td-hero-text-block { flex: 1; min-width: 260px; }
        .td-hero-main-title { color: #ffffff; font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .td-hero-subtitle { color: rgba(255, 255, 255, 0.65); margin-top: 8px; font-size: 0.95rem; line-height: 1.4; }
        
        .td-btn-back { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 7px; cursor: pointer; font-size: 0.82rem; margin-bottom: 14px; font-weight: 600; transition: background 0.2s ease; font-family: inherit; }
        .td-btn-back:hover { background: rgba(255, 255, 255, 0.18); color: #ffffff; }
        
        .td-btn-create-course { background: #ffffff; color: #1d4ed8; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; font-family: inherit; }
        .td-btn-create-course:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25); }
        .td-plus-sign { font-size: 1.1rem; margin-right: 2px; font-weight: 900; }
        
        .td-content-workspace { max-width: 1280px; margin: -48px auto 0; padding: 0 24px 60px; position: relative; z-index: 10; }
        .layout-spaced-banner { margin-bottom: 20px; }
        
        /* Semester Workspace Cards Deck layout */
        .td-card-grid-matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .td-semester-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 28px 24px; cursor: pointer; text-align: center; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease; }
        .td-semester-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border-color: #cbd5e1; }
        
        .td-sem-icon-avatar { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 18px; line-height: 1; }
        .td-semester-card-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.2px; }
        .td-semester-card-subtitle { color: #94a3b8; font-size: 0.85rem; margin: 0 0 16px 0; font-weight: 500; }
        .td-open-indicator-tag { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        
        /* Unified Academic Course Cards configurations rules */
        .td-course-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; position: relative; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .td-course-card:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .td-course-inner-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
        .td-course-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        
        .td-course-icon-badge { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; line-height: 1; }
        .td-course-code-pill { padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
        
        .td-course-card-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.2px; line-height: 1.4; }
        .td-course-card-desc { color: #64748b; font-size: 0.875rem; line-height: 1.5; flex: 1; margin: 0 0 20px 0; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .td-course-footer-row { display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 10px; }
        .td-student-count-indicator { color: #64748b; font-size: 0.82rem; font-weight: 600; }
        
        .td-btn-manage-link { padding: 8px 14px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.82rem; text-align: center; }
        
        /* Empty Fallbacks presentation blocks */
        .td-empty-workspace-state { grid-column: 1 / -1; text-align: center; padding: 60px 24px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 4px; box-sizing: border-box; }
        .td-empty-workspace-state.state-border-dashed { border: 2px dashed #cbd5e1; background: transparent; padding: 48px 24px; }
        .td-empty-art-logo { font-size: 3rem; margin-bottom: 10px; opacity: 0.4; line-height: 1; }
        .td-empty-state-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.3px; }
        .td-empty-state-subtitle { color: #94a3b8; font-size: 0.9rem; margin: 0 0 16px 0; font-weight: 500; }
        .td-empty-state-action-btn { font-size: 0.85rem; padding: 10px 20px; border-radius: 6px; font-weight: 700; }
        
        /* Form Creation Modals elements updates */
        .td-modal-context-subtitle { color: #64748b; font-size: 0.875rem; margin: -16px 0 24px 0; text-align: center; font-weight: 500; }
        
        /* Card highlighting themes arrays mappings loops */
        .sem-theme-1 { background-color: #eff6ff; color: #2563eb; } .edge-color-1 { border-top: 4px solid #2563eb; } .course-theme-1 { background-color: #eff6ff; color: #2563eb; }
        .sem-theme-2 { background-color: #ecfeff; color: #0891b2; } .edge-color-2 { border-top: 4px solid #0891b2; } .course-theme-2 { background-color: #ecfeff; color: #0891b2; }
        .sem-theme-3 { background-color: #f0fdf4; color: #059669; } .edge-color-3 { border-top: 4px solid #059669; } .course-theme-3 { background-color: #f0fdf4; color: #059669; }
        .sem-theme-4 { background-color: #fffbeb; color: #d97706; } .edge-color-4 { border-top: 4px solid #d97706; } .course-theme-4 { background-color: #fffbeb; color: #d97706; }
        .sem-theme-5 { background-color: #fef2f2; color: #dc2626; } .edge-color-5 { border-top: 4px solid #dc2626; } .course-theme-5 { background-color: #fef2f2; color: #dc2626; }
        .sem-theme-6 { background-color: #f5f3ff; color: #7c3aed; } .edge-color-6 { border-top: 4px solid #7c3aed; } .course-theme-6 { background-color: #f5f3ff; color: #7c3aed; }
        
        /* Modal Framework overrides mapped inside primary pages rules */
        .sm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .sm-modal-card { width: 100%; max-width: 460px; padding: 32px; background: #ffffff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); box-sizing: border-box; animation: td-scaleUp 0.2s ease-out; }
        .sm-modal-title { margin: 0 0 8px 0; color: #0f172a; text-align: center; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
        .sm-form-container { display: flex; flex-direction: column; gap: 14px; }
        .sm-form-group { display: flex; flex-direction: column; gap: 6px; }
        .sm-form-label { font-weight: 700; font-size: 0.825rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .sm-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.95rem; color: #0f172a; font-family: inherit; box-sizing: border-box; outline: none; transition: border-color 0.2s; background: #ffffff; }
        .sm-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .sm-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
        .sm-action-row { display: flex; gap: 12px; margin-top: 4px; }
        .sm-btn-secondary { flex: 1; padding: 12px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit; }
        .sm-btn-secondary:hover { background: #f8fafc; color: #0f172a; }
        .sm-btn-primary { flex: 1; padding: 12px; border: none; background: #2563eb; color: #ffffff; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: inherit; box-shadow: 0 4px 10px rgba(37,99,235,0.2); }
        .sm-btn-primary:hover { background: #1d4ed8; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; text-align: left; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        @keyframes td-scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Tablet Responsive Viewports Shifters Adaptation rules */
        @media (max-width: 768px) {
          .td-hero-header-row { flex-direction: column; align-items: center; text-align: center; }
          .td-btn-create-course { width: 100%; text-align: center; }
          .td-hero-banner { padding-bottom: 80px; }
          .td-content-workspace { margin-top: -30px; padding: 0 16px; }
        }
        /* Course Metadata Tags */
        .td-course-meta-tags { 
          display: flex; 
          gap: 8px; 
          margin-bottom: 12px; 
          flex-wrap: wrap; 
        }
        .td-meta-tag { 
          font-size: 0.72rem; 
          font-weight: 700; 
          padding: 4px 8px; 
          border-radius: 6px; 
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .program-tag { 
          background-color: #e0e7ff; 
          color: #3730a3; 
          border: 1px solid #c7d2fe;
        }
        .shift-tag { 
          background-color: #fef3c7; 
          color: #92400e; 
          border: 1px solid #fde68a;
        }
        .catalog-tag { 
          background-color: #f3e8ff; 
          color: #6b21a8; 
          border: 1px solid #e9d5ff;
        }
        .semester-code-tag { 
          background-color: #dcfce7; 
          color: #166534; 
          border: 1px solid #bbf7d0;
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;