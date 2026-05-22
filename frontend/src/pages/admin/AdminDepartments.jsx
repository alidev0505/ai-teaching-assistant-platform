import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCoursesAdmin } from '../../services/api';

const AdminDepartments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Roster States Matrix
  const [allCourses, setAllCourses] = useState([]); 
  const [stats, setStats] = useState({}); 
  
  // Interactive Modal UI States
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Department Class Groupings Coordinates
  const departments = [
    { id: 'BSCS', name: 'Computer Science', variant: 'blue' },
    { id: 'BSSE', name: 'Software Engineering', variant: 'emerald' },
    { id: 'BSAI', name: 'Artificial Intelligence', variant: 'purple' },
    { id: 'BSCYBER', name: 'Cyber Security', variant: 'red' },
    { id: 'BSIT', name: 'Information Technology', variant: 'amber' },
    { id: 'BBS', name: 'Business Administration', variant: 'cyan' },
    { id: 'BSAF', name: 'Accounting & Finance', variant: 'pink' },
    { id: 'OTHER', name: 'General / Other', variant: 'slate' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      const courses = res?.data?.courses || [];
      setAllCourses(courses);
      
      const newStats = {};
      const knownIds = departments.map(d => d.id);

      courses.forEach(c => {
        let prog = c.program ? c.program.toUpperCase().trim() : 'OTHER';
        if (!knownIds.includes(prog)) prog = 'OTHER';

        if (!newStats[prog]) {
          newStats[prog] = { courses: 0, teachers: new Set(), students: 0 };
        }
        
        newStats[prog].courses += 1;
        newStats[prog].students += (c.student_count || 0); 
        
        if (c.teacher_name) {
          newStats[prog].teachers.add(c.teacher_name);
        }
      });

      setStats(newStats);
    } catch (err) {
      console.error("Failed to compile department summary telemetry statistics", err);
    } finally {
      setLoading(false);
    }
  };

  const getDeptDetails = (deptId) => {
    const deptCourses = allCourses.filter(c => {
      const prog = c.program ? c.program.toUpperCase().trim() : 'OTHER';
      return deptId === 'OTHER' ? !departments.map(d => d.id).includes(prog) : prog === deptId;
    });

    const teachers = [...new Set(deptCourses.map(c => c.teacher_name).filter(Boolean))].sort();
    return { courses: deptCourses, teachers };
  };

  const closeModal = () => {
    setSelectedDept(null);
    setSelectedTeacher(null); 
    setModalSearch(''); 
  };

  return (
    <div className="add-page-wrapper">
      
      {/* ── HERO HEADER BAR ADMINISTRATIVE DECK ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <button onClick={() => navigate(-1)} className="adm-btn-back">
            ← Back to Dashboard
          </button>
          <h1 className="adm-hero-main-title">Academic Departments</h1>
          <p className="adm-hero-subtitle">Isolate specific program faculties, analyze course compositions, and audit student workloads indices.</p>
        </div>
      </div>

      {/* ── CENTRAL DEPARTMENTS DECK GRID SELECTIONS ── */}
      <div className="adm-content-workspace max-width-wide">
        {loading ? (
          <div className="sa-empty-workspace-state">
            <p className="sa-empty-state-subtitle">Processing organizational analytics structures...</p>
          </div>
        ) : (
          <div className="add-departments-matrix-grid">
            {departments.map((dept) => {
              const deptStats = stats[dept.id] || { courses: 0, teachers: new Set(), students: 0 };
              return (
                <div 
                  key={dept.id} 
                  onClick={() => setSelectedDept(dept)} 
                  className={`card add-dept-selection-card card-top-accent-${dept.variant}`}
                >
                  <div className="add-card-header-flex-row">
                    <span className={`add-dept-code-pill tag-variant-${dept.variant}`}>
                      {dept.id}
                    </span>
                    <span className="add-dept-counter-integer-text">
                      {deptStats.courses}
                    </span>
                  </div>
                  <h3 className="add-dept-card-title">{dept.name}</h3>
                  <p className="add-dept-card-subtitle">Department of {dept.id} Faculty Node</p>

                  {/* 3-COLUMN METRICS STATS MINI GRID */}
                  <div className="add-mini-metrics-row-grid">
                    <div className="add-mini-box-node">
                      <div className="add-mini-box-integer">{deptStats.courses}</div>
                      <div className="add-mini-box-label">Courses</div>
                    </div>
                    <div className="add-mini-box-node">
                      <div className="add-mini-box-integer">{deptStats.teachers.size}</div>
                      <div className="add-mini-box-label">Faculty</div>
                    </div>
                    <div className="add-mini-box-node bg-emerald-tint-override">
                      <div className="add-mini-box-integer color-emerald-override">{deptStats.students}</div>
                      <div className="add-mini-box-label color-emerald-override">Students</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= INTERACTIVE COMPONENT EXPANSION MODAL OVERLAY ================= */}
      {selectedDept && (
        <div className="sm-overlay add-modal-backdrop-blur">
          <div className="add-modal-card-viewport">
              
              {/* Modal Panel Top Header Section */}
              <div className="add-modal-header-container-card">
                <div className="add-modal-header-flex-alignment-row">
                  <div>
                    <h2 className="add-modal-main-title">{selectedDept.name}</h2>
                    <p className="add-modal-subtitle-text">
                      Organizational Core Code Reference: <strong className={`text-color-${selectedDept.variant}`}>{selectedDept.id}</strong>
                    </p>
                  </div>
                  <button onClick={closeModal} className="add-btn-modal-close-cross" aria-label="Dismiss window view">×</button>
                </div>

                {/* Subsystem Live Search Module input Field */}
                <div className="add-modal-search-wrapper-tray">
                  <input 
                    type="text" 
                    placeholder="🔍 Query course classifications descriptions, semester keys, or code signatures..." 
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="add-modal-search-input"
                  />
                </div>
              </div>

              {(() => {
                const details = getDeptDetails(selectedDept.id);
                
                let displayedCourses = selectedTeacher 
                  ? details.courses.filter(c => c.teacher_name === selectedTeacher)
                  : details.courses;

                if (modalSearch.trim()) {
                  const query = modalSearch.toLowerCase().trim();
                  displayedCourses = displayedCourses.filter(c => 
                    c.name.toLowerCase().includes(query) || 
                    c.class_code.toLowerCase().includes(query)
                  );
                }

                return (
                  <>
                    {/* Horizontal Interactive Filter Strip */}
                    <div className="add-modal-horizontal-scrollable-filter-bar">
                      <button
                        onClick={() => setSelectedTeacher(null)}
                        className={`add-modal-filter-pill-btn ${selectedTeacher === null ? 'active-filter-state' : ''}`}
                      >
                        All Department Faculty
                      </button>

                      {details.teachers.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTeacher(t === selectedTeacher ? null : t)}
                          className={`add-modal-filter-pill-btn ${selectedTeacher === t ? `active-accent-state-${selectedDept.variant}` : ''}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Main Target Courses Output Subgrid Frame */}
                    <div className="add-modal-scrollable-workspace-pane">
                      <div className="add-modal-pane-header-row-flex">
                        <h3 className="add-modal-workspace-inner-heading">
                          {selectedTeacher ? `Syllabus Tracks under: ${selectedTeacher}` : `All Registered Active Course Syllabus Units`}
                        </h3>
                        <span className="rt-badge rt-badge-slides">
                          {displayedCourses.length} Listings Indexed
                        </span>
                      </div>

                      {displayedCourses.length === 0 ? (
                        <div className="sa-empty-workspace-state padding-vertical-wide">
                          <div className="sa-empty-art-logo">📂</div>
                          <p className="sa-empty-state-subtitle">{modalSearch ? `No course entries tracked matching search criteria: "${modalSearch}"` : "No classroom units currently map to this selection."}</p>
                        </div>
                      ) : (
                        <div className="add-modal-workspace-subgrid-cards-matrix">
                          {displayedCourses.map(c => (
                            <div key={c.id} className="add-modal-inner-course-item-node-card">
                              <div className="add-modal-item-node-header-row">
                                <h4 className="add-modal-item-node-title">{c.name}</h4>
                                {c.course_catalog_code && (
                                  <span className="rt-badge rt-badge-quiz text-transform-uppercase-override">
                                    {c.course_catalog_code}
                                  </span>
                                )}
                              </div>

                              <div className="adc-course-meta-sub-row">
                                <span className="adc-catalog-code-span-badge">🗓️ {c.semester_code || 'Unspecified Term'}</span>
                                <span className="adc-catalog-code-span-badge">⏰ Shift: {c.shift === 'M' ? 'Morning' : 'Evening'}</span>
                                {c.room && <span className="rt-badge rt-badge-lecture text-transform-uppercase-override">📍 {c.room}</span>}
                              </div>

                              <div className="add-modal-item-node-footer-faculty-row">
                                <div className="add-modal-item-faculty-avatar-circle">
                                  {c.teacher_name ? c.teacher_name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span className="add-modal-item-faculty-name-string">{c.teacher_name || 'Unassigned Instructor'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDepartments;