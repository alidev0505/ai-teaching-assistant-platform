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
    
    // ✅ PARSING PROTECTION: Optional chaining guarantees structure safety checks on selection triggers
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
    </div>
  );
};

export default AdminClass;