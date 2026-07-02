import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCoursesAdmin, adminUnlockAttendance, downloadAttendanceFile } from '../../services/api';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await getAllCoursesAdmin();
      setCourses(res?.data?.courses || []);
    } catch (err) {
      console.error("Error loading course registers metrics:", err);
      setError("Failed to synchronize active course registry documentation maps.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (id, courseName) => {
    if (!window.confirm(`Unlock attendance parameters for "${courseName}"?\n\nThe instructor will regain editing permissions over this sheet.`)) return;
    setSystemAlert({ type: '', text: '' });
    
    try {
      await adminUnlockAttendance(id);
      setSystemAlert({ type: 'success', text: `Successfully unlocked attendance for course: ${courseName}` });
      loadCourses(); 
    } catch (err) { 
      setSystemAlert({ type: 'error', text: 'Transaction Failure: Stalled processing structural unlock command.' });
    }
  };

  const handleDownload = (id) => {
    setSystemAlert({ type: '', text: '' });
    try {
      downloadAttendanceFile(id);
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Buffer Link Error: Failed to compile spreadsheet payload.' });
    }
  };

  // 🔹 SEARCH FILTER LOGIC — Protected against unassigned values
  const filteredCourses = courses.filter(c => {
    const nameStr = c?.name?.toLowerCase() || '';
    const teacherStr = c?.teacher_name?.toLowerCase() || '';
    const classCodeStr = c?.class_code || '';
    const catalogCodeStr = c?.course_catalog_code?.toLowerCase() || '';
    const programStr = c?.program?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return (
      nameStr.includes(query) ||
      teacherStr.includes(query) ||
      classCodeStr.includes(searchTerm) ||
      catalogCodeStr.includes(query) ||
      programStr.includes(query)
    );
  });

  return (
    <div className="adm-page-wrapper">
      
      {/* ── HERO BANNER HEADER CONSOLE ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <button onClick={() => navigate(-1)} className="adm-btn-back">
            ← Back to Dashboard
          </button>
          <h1 className="adm-hero-main-title">Attendance Sheets Management</h1>
          <p className="adm-hero-subtitle">Review finalized session records, manage database overrides locks, and compile institutional logs.</p>
        </div>
      </div>

      <div className="adm-content-workspace max-width-wide">
        
        {/* Search Input Box Control Area */}
        <div className="adc-search-bar-box">
             <input 
                type="text" 
                placeholder="🔍 Filter attendance records by description title, instructor name, program catalog, or class access keys..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="adc-search-input-field"
            />
        </div>

        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} adc-spaced-banner`}>
            {systemAlert.text}
          </div>
        )}

        {/* ── COURSE REGISTRY DATA LISTINGS DECK ── */}
        <div className="card adc-table-container-card">
            
            {/* Context Panel Header Sub-bar */}
            <div className="qd-panel-inner-header-banner adc-panel-flex-alignment-row">
                <h3 className="qd-visual-panel-title remove-margin-bottom">Course Registry Index</h3>
                <span className="rt-badge rt-badge-lecture">
                    Catalog Records: {filteredCourses.length}
                </span>
            </div>

            {loading ? (
                <div className="sa-empty-workspace-state"><p className="sa-empty-state-subtitle">Loading curriculum attendance parameters...</p></div>
            ) : error ? (
                <div className="auth-alert error layout-spaced-banner m-20">{error}</div>
            ) : filteredCourses.length === 0 ? (
                <div className="sa-empty-workspace-state">
                    <div className="sa-empty-art-logo">📅</div>
                    <p className="sa-empty-state-title">No matching parameters logged</p>
                    <p className="sa-empty-state-subtitle">{courses.length === 0 ? "No centralized course records logged into this active session registry." : "No courses match your active search terms."}</p>
                </div>
            ) : (
                <div className="adc-responsive-table-scroll-wrapper">
                    <table className="adc-master-schedule-table">
                        <thead>
                            <tr>
                                <th>Syllabus Course Coordinates</th>
                                <th>Assigned Instructor</th>
                                <th className="amt-th-center-align">Handshake Status</th>
                                <th className="adc-text-right">Operational Overrides</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCourses.map(course => (
                                <tr key={course.id} className="adc-table-tr-node">
                                    
                                    {/* 1. Course Profile and Meta Coordinates Tags */}
                                    <td className="adc-td-primary-title-block">
                                        <div className="adc-course-main-string-title-wrapper">
                                            <span className="adc-course-main-string-title">{course.name}</span>
                                            {course.course_catalog_code && (
                                                <span className="rt-badge rt-badge-quiz">
                                                    {course.course_catalog_code}
                                                </span>
                                            )}
                                        </div>

                                        <div className="adc-course-meta-sub-row m-top-6">
                                            {course.program && <span className="adc-catalog-code-span-badge">🎓 {course.program}</span>}
                                            {course.semester_code && <span className="adc-catalog-code-span-badge">🗓️ {course.semester_code}</span>}
                                            {course.shift && <span className="adc-catalog-code-span-badge">⏰ {course.shift === 'M' ? 'Morning' : 'Evening'}</span>}
                                        </div>

                                        <div className="sa-class-code-pill width-fit m-top-6">
                                            Key signature: <strong>{course.class_code}</strong>
                                        </div>
                                    </td>

                                    {/* 2. Instructor Details Block Element */}
                                    <td>
                                        <div className="lc-info-block">
                                            <div className="adc-td-instructor-text-cell">{course.teacher_name || 'Unassigned Faculty'}</div>
                                            <div className="sa-text-muted text-micro">{course.teacher_email || 'No email log recorded'}</div>
                                        </div>
                                    </td>

                                    {/* 3. Immutable Lock Status Flags */}
                                    <td className="amt-th-center-align">
                                        {course.is_attendance_locked ? (
                                            <span className="ab-banner ab-type-info padding-badge-override font-weight-800">
                                                Finalized Sheet
                                            </span>
                                        ) : (
                                            <span className="ab-banner ab-type-warning padding-badge-override font-weight-700">
                                                Active Sheet
                                            </span>
                                        )}
                                    </td>

                                    {/* 4. Action Verification Control Modals Drivers Links */}
                                    <td className="adc-text-right">
                                        <div className="adc-action-buttons-inline-group-flex">
                                            {course.is_attendance_locked ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleUnlock(course.id, course.name)}
                                                        title="Unlock Attendance Sheet"
                                                        className="adc-btn-inline-cancel btn-amber-accent-override"
                                                    >
                                                        Unlock Sheet
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDownload(course.id)}
                                                        title="Download Excel CSV Document Summary"
                                                        className="adc-btn-inline-save"
                                                    >
                                                        Export CSV
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="sa-text-muted italic-text font-weight-500 m-right-12">Awaiting Instructor Lock...</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .adm-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        
        /* Fixed Hero Banner Elements */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; margin-bottom: 20px; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; }

        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        
        .adc-search-bar-box { margin-bottom: 0px; }
        .adc-search-input-field { width: 100%; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.95rem; outline: none; box-shadow: 0 4px 12px rgba(0,0,0,0.02); box-sizing: border-box; transition: border-color 0.2s; font-family: inherit; }
        .adc-search-input-field:focus { border-color: #4f46e5; }
        
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        .adc-table-container-card { padding: 0 !important; }
        
        .qd-panel-inner-header-banner { padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .qd-visual-panel-title { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.2px; }
        .remove-margin-bottom { margin-bottom: 0 !important; }
        
        /* Badges */
        .rt-badge { padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; display: inline-block; }
        .rt-badge-lecture { background-color: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .rt-badge-quiz { background-color: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
        
        .ab-banner { padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .ab-type-info { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .ab-type-warning { background-color: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
        .padding-badge-override { padding: 6px 12px; font-size: 0.8rem; }
        .font-weight-800 { font-weight: 800; }
        .font-weight-700 { font-weight: 700; }
        
        /* Table Layout */
        .adc-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; }
        .adc-master-schedule-table { width: 100%; border-collapse: collapse; text-align: left; }
        .adc-master-schedule-table th { padding: 16px 20px; background-color: #f8fafc; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap; }
        .adc-master-schedule-table td { vertical-align: middle; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
        .adc-table-tr-node:hover { background-color: #f8fafc; }
        .adc-table-tr-node:last-child td { border-bottom: none; }
        
        .adc-td-primary-title-block { display: flex; flex-direction: column; gap: 4px; }
        .adc-course-main-string-title-wrapper { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .adc-course-main-string-title { font-weight: 800; color: #0f172a; font-size: 1rem; }
        
        .adc-course-meta-sub-row { font-size: 0.75rem; color: #64748b; font-weight: 600; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .adc-catalog-code-span-badge { background-color: #f1f5f9; padding: 3px 8px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .sa-class-code-pill { background-color: #eff6ff; color: #1e40af; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; border: 1px solid #bfdbfe; display: inline-block; }
        .width-fit { width: fit-content; }
        .m-top-6 { margin-top: 6px; }
        
        .lc-info-block { display: flex; flex-direction: column; gap: 4px; }
        .adc-td-instructor-text-cell { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
        .sa-text-muted { color: #64748b; }
        .text-micro { font-size: 0.8rem; }
        
        .amt-th-center-align { text-align: center; }
        .adc-text-right { text-align: right; }
        
        /* Action Buttons */
        .adc-action-buttons-inline-group-flex { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
        .adc-btn-inline-cancel { background: #ffffff; color: #64748b; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .btn-amber-accent-override { color: #d97706; border-color: #fcd34d; }
        .btn-amber-accent-override:hover { background: #fffbeb; color: #b45309; }
        .adc-btn-inline-save { background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .adc-btn-inline-save:hover { background: #1d4ed8; }
        
        /* Empty States & Status Messages */
        .sa-empty-workspace-state { padding: 60px 24px; text-align: center; border: 2px dashed #cbd5e1; border-radius: 12px; margin: 24px; background: #f8fafc; }
        .sa-empty-art-logo { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
        .sa-empty-state-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
        .sa-empty-state-subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }
        
        .font-weight-500 { font-weight: 500; }
        .italic-text { font-style: italic; }
        .m-right-12 { margin-right: 12px; display: inline-block; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .adc-spaced-banner, .layout-spaced-banner { margin-bottom: 0; }
        .m-20 { margin: 20px; }
        
        @media (max-width: 768px) {
          .adc-panel-flex-alignment-row { flex-direction: column; align-items: flex-start; gap: 12px; }
          .adc-action-buttons-inline-group-flex { justify-content: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default AdminCourses;