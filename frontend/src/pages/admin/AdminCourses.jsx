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
    </div>
  );
};

export default AdminCourses;