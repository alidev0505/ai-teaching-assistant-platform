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
    { id: 'BSCY', name: 'Cyber Security', variant: 'red' },
    { id: 'BSIT', name: 'Information Technology', variant: 'amber' },
    { id: 'BBA', name: 'Business Administration', variant: 'cyan' },
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
            <div className="adc-spinner" />
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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .add-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        
        /* Fixed Hero Banner Elements */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; margin-bottom: 20px; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; }

        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        
        .add-departments-matrix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        .add-dept-selection-card { cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
        .add-dept-selection-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        
        .add-card-header-flex-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .add-dept-code-pill { padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; border: 1px solid transparent; }
        .add-dept-counter-integer-text { font-size: 1.5rem; font-weight: 900; color: #0f172a; line-height: 1; }
        
        .add-dept-card-title { margin: 0 0 4px 0; font-size: 1.15rem; font-weight: 800; color: #1e293b; letter-spacing: -0.01em; }
        .add-dept-card-subtitle { margin: 0 0 20px 0; font-size: 0.85rem; color: #64748b; font-weight: 500; }
        
        .add-mini-metrics-row-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: auto; }
        .add-mini-box-node { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; }
        .add-mini-box-integer { font-weight: 800; font-size: 1.1rem; color: #334155; }
        .add-mini-box-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
        
        .bg-emerald-tint-override { background-color: #f0fdf4; border-color: #dcfce7; }
        .color-emerald-override { color: #166534; }

        /* Dynamic Variant Themes */
        .card-top-accent-blue { border-top: 4px solid #3b82f6; }
        .tag-variant-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .text-color-blue { color: #2563eb; }
        .active-accent-state-blue { background: #3b82f6 !important; color: white !important; border-color: #3b82f6 !important; }
        
        .card-top-accent-emerald { border-top: 4px solid #10b981; }
        .tag-variant-emerald { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .text-color-emerald { color: #10b981; }
        .active-accent-state-emerald { background: #10b981 !important; color: white !important; border-color: #10b981 !important; }

        .card-top-accent-purple { border-top: 4px solid #8b5cf6; }
        .tag-variant-purple { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
        .text-color-purple { color: #8b5cf6; }
        .active-accent-state-purple { background: #8b5cf6 !important; color: white !important; border-color: #8b5cf6 !important; }

        .card-top-accent-red { border-top: 4px solid #ef4444; }
        .tag-variant-red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .text-color-red { color: #ef4444; }
        .active-accent-state-red { background: #ef4444 !important; color: white !important; border-color: #ef4444 !important; }

        .card-top-accent-amber { border-top: 4px solid #f59e0b; }
        .tag-variant-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .text-color-amber { color: #f59e0b; }
        .active-accent-state-amber { background: #f59e0b !important; color: white !important; border-color: #f59e0b !important; }

        .card-top-accent-cyan { border-top: 4px solid #06b6d4; }
        .tag-variant-cyan { background: #ecfeff; color: #0369a1; border-color: #a5f3fc; }
        .text-color-cyan { color: #06b6d4; }
        .active-accent-state-cyan { background: #06b6d4 !important; color: white !important; border-color: #06b6d4 !important; }

        .card-top-accent-pink { border-top: 4px solid #ec4899; }
        .tag-variant-pink { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
        .text-color-pink { color: #ec4899; }
        .active-accent-state-pink { background: #ec4899 !important; color: white !important; border-color: #ec4899 !important; }

        .card-top-accent-slate { border-top: 4px solid #64748b; }
        .tag-variant-slate { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
        .text-color-slate { color: #64748b; }
        .active-accent-state-slate { background: #64748b !important; color: white !important; border-color: #64748b !important; }

        /* Modal Overlay Subsystem */
        .sm-overlay { position: fixed; inset: 0; background-color: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px; box-sizing: border-box; }
        .add-modal-backdrop-blur { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        .add-modal-card-viewport { background-color: #ffffff; border-radius: 16px; width: 100%; max-width: 1000px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; animation: add-scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1); }

        .add-modal-header-container-card { padding: 28px 32px 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
        .add-modal-header-flex-alignment-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .add-modal-main-title { margin: 0 0 6px 0; font-size: 1.4rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
        .add-modal-subtitle-text { margin: 0; font-size: 0.9rem; color: #64748b; font-weight: 500; }
        
        .add-btn-modal-close-cross { background: transparent; border: none; font-size: 2rem; line-height: 1; color: #94a3b8; cursor: pointer; padding: 0; margin-top: -4px; transition: color 0.15s; }
        .add-btn-modal-close-cross:hover { color: #0f172a; }

        .add-modal-search-wrapper-tray { width: 100%; }
        .add-modal-search-input { width: 100%; padding: 12px 16px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.95rem; outline: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); box-sizing: border-box; transition: border-color 0.2s; font-family: inherit; }
        .add-modal-search-input:focus { border-color: #4f46e5; }

        .add-modal-horizontal-scrollable-filter-bar { display: flex; gap: 10px; padding: 16px 32px; overflow-x: auto; background: #ffffff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
        .add-modal-horizontal-scrollable-filter-bar::-webkit-scrollbar { height: 6px; }
        .add-modal-horizontal-scrollable-filter-bar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        
        .add-modal-filter-pill-btn { padding: 8px 16px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; border: 1px solid #e2e8f0; background: #ffffff; color: #475569; cursor: pointer; white-space: nowrap; transition: all 0.15s; font-family: inherit; }
        .add-modal-filter-pill-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
        .active-filter-state { background: #0f172a !important; color: #ffffff !important; border-color: #0f172a !important; }

        .add-modal-scrollable-workspace-pane { padding: 32px; overflow-y: auto; flex-grow: 1; background: #f1f5f9; }
        .add-modal-pane-header-row-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .add-modal-workspace-inner-heading { margin: 0; font-size: 1.1rem; font-weight: 800; color: #1e293b; }

        .add-modal-workspace-subgrid-cards-matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .add-modal-inner-course-item-node-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 16px; }
        
        .add-modal-item-node-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .add-modal-item-node-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; line-height: 1.3; }
        
        .adc-course-meta-sub-row { font-size: 0.75rem; color: #64748b; font-weight: 700; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .adc-catalog-code-span-badge { background-color: #f1f5f9; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; }

        .add-modal-item-node-footer-faculty-row { display: flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .add-modal-item-faculty-avatar-circle { width: 30px; height: 30px; border-radius: 50%; background: #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
        .add-modal-item-faculty-name-string { font-size: 0.85rem; font-weight: 700; color: #334155; }

        /* Reused Shared Badges */
        .rt-badge { padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; display: inline-block; white-space: nowrap; }
        .rt-badge-slides { background-color: #fffbeb; color: #d97706; border-color: #fef3c7; }
        .rt-badge-quiz { background-color: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
        .rt-badge-lecture { background-color: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .text-transform-uppercase-override { text-transform: uppercase; }

        /* Splash & Empty States */
        .sa-empty-workspace-state { padding: 60px 24px; text-align: center; border: 2px dashed #cbd5e1; border-radius: 12px; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .padding-vertical-wide { padding: 80px 24px; border: none; background: transparent; }
        .sa-empty-art-logo { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
        .sa-empty-state-subtitle { color: #64748b; font-size: 0.95rem; margin: 0; font-weight: 500; }
        
        .adc-spinner { width: 44px; height: 44px; border: 4px solid #cbd5e1; border-top-color: #4f46e5; border-radius: 50%; animation: adc-spin 0.8s linear infinite; margin-bottom: 16px; }
        @keyframes adc-spin { to { transform: rotate(360deg); } }
        @keyframes add-scale-up { from { transform: scale(0.98); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        @media (max-width: 768px) {
          .add-modal-card-viewport { height: 95vh; max-height: none; border-radius: 12px; }
          .add-modal-header-container-card { padding: 20px; }
          .add-modal-horizontal-scrollable-filter-bar { padding: 12px 20px; }
          .add-modal-scrollable-workspace-pane { padding: 20px; }
        }
      `}</style>
    </div>
  );
};

export default AdminDepartments;