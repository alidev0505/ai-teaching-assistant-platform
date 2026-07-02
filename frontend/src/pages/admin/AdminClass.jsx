import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCoursesAdmin, updateCourseSchedule, downloadScheduleCsv } from '../../services/api'; 

const AdminClass = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  // Edit Inline State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ day: '', time: '', room: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getAllCoursesAdmin();
      setCourses(res?.data?.courses || []);
    } catch (err) {
      console.error("Failed to synchronize course schedule records layout:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setSystemAlert({ type: '', text: '' });
    try {
      await downloadScheduleCsv();
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Export Disruption: Failed to compile download buffer file parameters.' });
    } finally {
      setDownloading(false);
    }
  };

  const checkClash = (course) => {
    const clash = courses.find(c => 
      c.id !== course.id && 
      c.day === course.day && 
      c.time === course.time && 
      c.room === course.room &&
      c.day && c.time && c.room 
    );
    return clash ? true : false;
  };

  const handleEditClick = (course) => {
    setSystemAlert({ type: '', text: '' });
    setEditingId(course.id);
    
    // Optional chaining guarantees structure safety checks on selection triggers
    const timeSegment = course.time ? course.time.split(' - ')[0] : '';
    setEditForm({ 
        day: course.day || '', 
        time: timeSegment, 
        room: course.room || '' 
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    setSystemAlert({ type: '', text: '' });
    try {
        await updateCourseSchedule(id, editForm);
        const updatedCourses = courses.map(c => 
            c.id === id ? { ...c, ...editForm } : c
        );
        setCourses(updatedCourses);
        setEditingId(null);
        setSystemAlert({ type: 'success', text: 'Syllabus schedule configurations successfully written and assigned!' });
    } catch (err) {
        setSystemAlert({ type: 'error', text: 'Transaction Failure: Stalled processing schedule alterations.' });
    } finally {
        setSaving(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.course_catalog_code?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.room?.toLowerCase().includes(searchTerm.toLowerCase());

    if (showConflictsOnly) {
        return matchesSearch && checkClash(c);
    }
    return matchesSearch;
  });

  const conflictCount = courses.filter(c => checkClash(c)).length;

  if (loading) return (
    <div className="adc-loading-splash">
      <div className="adc-spinner" />
      <div className="adc-splash-text">Loading Schedule Logistics...</div>
      <style>{`
        .adc-loading-splash { min-height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; gap: 16px; }
        .adc-spinner { width: 44px; height: 44px; border: 4px solid #cbd5e1; border-top-color: #4f46e5; border-radius: 50%; animation: adc-spin 0.8s linear infinite; }
        .adc-splash-text { color: #475569; font-weight: 600; font-size: 0.95rem; }
        @keyframes adc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="adc-page-wrapper">
      
      {/* ── HERO HEADER BAR ADMINISTRATIVE DECK ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <button onClick={() => navigate(-1)} className="adm-btn-back">← Back</button>
          
          <div className="adc-hero-flex-row">
              <div className="adc-hero-text-block">
                <h1 className="adm-hero-main-title">Class Logistics Schedule</h1>
                <p className="adm-hero-subtitle">Coordinate institutional lecture allocations, map classrooms, and settle {conflictCount} database conflicts.</p>
              </div>
              
              <div className="adc-action-buttons-flex-strip">
                  <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="adc-btn-export-csv"
                  >
                    {downloading ? 'Compiling CSV...' : '📥 Export Master CSV'}
                  </button>

                  <button 
                    onClick={() => { setSystemAlert({ type: '', text: '' }); setShowConflictsOnly(!showConflictsOnly); }}
                    className={`adc-btn-conflict-toggle ${showConflictsOnly ? 'active-alert-toggle-state' : ''}`}
                  >
                    {showConflictsOnly ? 'Show All Active Classes' : `⚠️ Show ${conflictCount} Conflicts Only`}
                  </button>
              </div>
          </div>
        </div>
      </div>

      {/* ── CORE OPERATIONS SCHEDULE DATA MATRIX ── */}
      <div className="adm-content-workspace max-width-wide">
        
        {/* Search Parameter Processing Input Zone */}
        <div className="adc-search-bar-box">
            <input 
                type="text" 
                placeholder="🔍 Search class registry by description name, catalog code, teacher signature, or room coordinates..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="adc-search-input-field"
            />
        </div>

        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} adc-spaced-banner`}>
            {systemAlert.text}
          </div>
        )}

        {/* Master Timetable Data Grid Listings Panel */}
        <div className="card adc-table-container-card">
            <div className="adc-responsive-table-scroll-wrapper">
              <table className="adc-master-schedule-table">
                <thead>
                    <tr>
                        <th>Course Channel Title</th>
                        <th>Instructor Guide</th>
                        <th>Assigned Day</th>
                        <th>Lecture Time Rails</th>
                        <th>Room Assignment</th>
                        <th className="adc-text-right">Actions Matrix</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCourses.length === 0 ? (
                        <tr><td colSpan="6" className="adc-table-empty-fallback-text">No active class schedule metrics matched your parameters.</td></tr>
                    ) : filteredCourses.map(course => {
                        const isClash = checkClash(course); 
                        const isEditing = editingId === course.id;

                        return (
                            <tr key={course.id} className={`adc-table-tr-node ${isClash ? 'clash-alert-row-danger-state' : ''}`}>
                                <td className="adc-td-primary-title-block">
                                    <div className="adc-course-main-string-title">{course.name}</div>
                                    <div className="adc-course-meta-sub-row">
                                        {course.course_catalog_code && <span className="adc-catalog-code-span-badge">{course.course_catalog_code}</span>}
                                        {course.course_catalog_code && <span className="adc-divider-pipe">|</span>}
                                        <span className="adc-class-code-span-badge">{course.class_code}</span>
                                    </div>
                                    {isClash && <span className="adc-conflict-alert-tag-pill">⚠️ LOGISTICS CONFLICT DETECTED</span>}
                                </td>
                                <td className="adc-td-instructor-text-cell">{course.teacher_name || 'Unassigned Faculty'}</td>
                                
                                {/* Day Data Column Entry Select */}
                                <td>
                                    {isEditing ? (
                                        <select 
                                            value={editForm.day} 
                                            onChange={e => setEditForm({...editForm, day: e.target.value})}
                                            className="rp-input-field select-cursor-pointer adc-input-inline-editor-adjustment"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Monday">Monday</option>
                                            <option value="Tuesday">Tuesday</option>
                                            <option value="Wednesday">Wednesday</option>
                                            <option value="Thursday">Thursday</option>
                                            <option value="Friday">Friday</option>
                                            <option value="Saturday">Saturday</option>
                                        </select>
                                    ) : (
                                        <span className={`adc-metadata-indicator-badge ${course.day ? 'badge-state-filled' : 'badge-state-empty'}`}>
                                            {course.day || 'Not Configured'}
                                        </span>
                                    )}
                                </td>

                                {/* Time Data Column Entry Select */}
                                <td>
                                    {isEditing ? (
                                        <input 
                                            type="time" 
                                            value={editForm.time} 
                                            onChange={e => setEditForm({...editForm, time: e.target.value})}
                                            className="rp-input-field adc-input-inline-editor-adjustment"
                                        />
                                    ) : (
                                        <span className={`adc-metadata-indicator-badge ${course.time ? 'badge-state-filled' : 'badge-state-empty'}`}>
                                            {course.time || 'Not Configured'}
                                        </span>
                                    )}
                                </td>

                                {/* Room Data Column Entry Select */}
                                <td>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editForm.room} 
                                            onChange={e => setEditForm({...editForm, room: e.target.value})}
                                            placeholder="Room Key"
                                            className="rp-input-field adc-input-inline-editor-adjustment inline-width-override-box"
                                        />
                                    ) : (
                                        <span className={`adc-room-indicator-badge ${isClash ? 'room-state-clash' : (course.room ? 'room-state-filled' : 'room-state-empty')}`}>
                                            {course.room || 'No Room Assigned'}
                                        </span>
                                    )}
                                </td>

                                <td className="adc-text-right">
                                    {isEditing ? (
                                        <div className="adc-action-buttons-inline-group-flex">
                                            <button onClick={() => handleSave(course.id)} disabled={saving} className="adc-btn-inline-save">
                                                {saving ? '...' : 'Save'}
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="adc-btn-inline-cancel">Cancel</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEditClick(course)} className="adc-btn-inline-edit">Modify Layout</button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
              </table>
            </div>
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .adc-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        .adm-hero-container {
          position: relative;
          z-index: 20; /* Force buttons to sit above the overlapping workspace */
        }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        /* Fixed Hero Banner Elements */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; margin-bottom: 20px; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; }

        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        
        .adc-hero-flex-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; }
        .adc-action-buttons-flex-strip { display: flex; gap: 12px; }
        .adc-btn-export-csv, .adc-btn-conflict-toggle { padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #ffffff; transition: all 0.15s; font-family: inherit; }
        .adc-btn-export-csv:hover:not(:disabled), .adc-btn-conflict-toggle:hover { background: rgba(255,255,255,0.15); }
        .adc-btn-export-csv:disabled { opacity: 0.6; cursor: not-allowed; }
        .adc-btn-conflict-toggle.active-alert-toggle-state { background: #ef4444; border-color: #ef4444; }
        
        .adc-search-bar-box { margin-bottom: 0px; }
        .adc-search-input-field { width: 100%; padding: 14px 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.95rem; outline: none; box-shadow: 0 4px 12px rgba(0,0,0,0.02); box-sizing: border-box; transition: border-color 0.2s; font-family: inherit; }
        .adc-search-input-field:focus { border-color: #4f46e5; }
        
        .adc-table-container-card { padding: 0 !important; overflow: hidden; }
        .adc-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; }
        .adc-master-schedule-table { width: 100%; border-collapse: collapse; text-align: left; }
        .adc-master-schedule-table th { padding: 16px 20px; background-color: #f8fafc; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: 0.05em; }
        .adc-master-schedule-table td { vertical-align: middle; padding: 14px 20px; }
        
        .adc-table-tr-node { border-bottom: 1px solid #f1f5f9; transition: background-color 0.15s; }
        .adc-table-tr-node:hover { background-color: #f8fafc; }
        .adc-table-tr-node:last-child { border-bottom: none; }
        .clash-alert-row-danger-state { background-color: #fef2f2 !important; border-left: 4px solid #ef4444; }
        
        .adc-td-primary-title-block { display: flex; flex-direction: column; gap: 4px; }
        .adc-course-main-string-title { font-weight: 800; color: #0f172a; font-size: 0.95rem; }
        .adc-course-meta-sub-row { font-size: 0.75rem; color: #64748b; font-weight: 700; display: flex; gap: 6px; align-items: center; }
        .adc-catalog-code-span-badge { background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
        .adc-class-code-span-badge { background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; }
        .adc-divider-pipe { color: #cbd5e1; }
        .adc-conflict-alert-tag-pill { display: inline-block; font-size: 0.7rem; color: #dc2626; font-weight: 800; margin-top: 4px; }
        
        .adc-metadata-indicator-badge { font-weight: 600; font-size: 0.825rem; padding: 4px 8px; border-radius: 4px; display: inline-block; }
        .badge-state-empty { color: #94a3b8; background: #f1f5f9; }
        .badge-state-filled { color: #334155; background: #e2e8f0; }
        
        .adc-room-indicator-badge { font-weight: 700; font-size: 0.825rem; padding: 4px 8px; border-radius: 4px; display: inline-block; }
        .room-state-filled { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .room-state-empty { background-color: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }
        .room-state-clash { background-color: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 800; }
        
        .rp-input-field { border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.9rem; outline: none; color: #0f172a; }
        .adc-input-inline-editor-adjustment { height: 34px; padding: 4px 8px; width: 100%; box-sizing: border-box; }
        .inline-width-override-box { min-width: 100px; }
        
        .adc-text-right { text-align: right; }
        .adc-action-buttons-inline-group-flex { display: flex; justify-content: flex-end; gap: 8px; }
        .adc-btn-inline-save, .adc-btn-inline-edit, .adc-btn-inline-cancel { cursor: pointer; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; border: none; font-family: inherit; transition: all 0.15s; }
        .adc-btn-inline-save { background: #2563eb; color: white; }
        .adc-btn-inline-save:hover:not(:disabled) { background: #1d4ed8; }
        .adc-btn-inline-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .adc-btn-inline-edit { background: #f1f5f9; color: #475569; }
        .adc-btn-inline-edit:hover { background: #e2e8f0; color: #0f172a; }
        .adc-btn-inline-cancel { background: #ffffff; color: #64748b; border: 1px solid #cbd5e1; }
        .adc-btn-inline-cancel:hover { background: #f8fafc; color: #0f172a; }
        
        .adc-table-empty-fallback-text { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 500; font-size: 0.95rem; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .adc-spaced-banner { margin-bottom: 0px; }
        
        @media (max-width: 900px) {
            .adc-hero-flex-row { flex-direction: column; align-items: stretch; }
            .adc-action-buttons-flex-strip { width: 100%; flex-direction: column; }
            .adc-btn-export-csv, .adc-btn-conflict-toggle { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default AdminClass;