import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUserRole, deleteUser, getAdminCourses, deleteCourse } from '../../services/api';
import AdminBatchUpload from './AdminBatchUpload'; 

const AdminUsers = () => {
  const navigate = useNavigate();

  // ─── DATA MATRIX STATES ────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─── UI SYSTEM FLAGS ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('users'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ─── ALPHANUMERIC SEARCH PATHS ─────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  const loadAllData = async () => {
    setLoading(true);
    setSystemAlert({ type: '', text: '' });
    try {
      const userRes = await getUsers();
      setUsers(userRes?.data?.users || []);
      await fetchCoursesData();
    } catch (err) {
      console.error("Administrative systems baseline data load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const fetchCoursesData = async () => {
    try {
        const res = await getAdminCourses();
        setCourses(res?.data?.courses || []);
    } catch (err) { 
        console.error("Course metadata catalog tracking load error:", err); 
    }
  };

  // ─── FILTER & PAGINATION MATRIX SCHEMES ────────────────────────────────────
  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(c => 
    (c.name && c.name.toLowerCase().includes(courseSearch.toLowerCase())) ||
    (c.teacher_name && c.teacher_name.toLowerCase().includes(courseSearch.toLowerCase())) ||
    (c.class_code && c.class_code.includes(courseSearch)) ||
    (c.course_catalog_code && c.course_catalog_code.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  const dataToPaginate = activeTab === 'users' ? filteredUsers : filteredCourses;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dataToPaginate.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dataToPaginate.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ─── INFRASTRUCTURE DATA WRITING HANDLERS ─────────────────────────────────
  const handleRoleChange = async (id, newRole) => {
    setSystemAlert({ type: '', text: '' });
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    try {
        await updateUserRole(id, { role: newRole });
        setSystemAlert({ type: 'success', text: 'Security credentials level adjusted and written successfully.' });
    } catch (err) { 
      setSystemAlert({ type: 'error', text: 'Transaction Failure: Stalled committing role updates.' }); 
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${username}"?`)) return;
    setSystemAlert({ type: '', text: '' });
    try {
        await deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
        setSystemAlert({ type: 'success', text: 'Account configuration records purged from registration registry.' });
    } catch (err) { 
      setSystemAlert({ type: 'error', text: 'Purge Disruption: Failed to modify identity fields mappings.' }); 
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`DELETE CURRICULUM VALUE COURSE: "${courseName}"?\n\nThis execute cycle drops ALL exams, evaluations, RAG assets, and student grades associated with it.`)) return;
    setSystemAlert({ type: '', text: '' });
    try {
      const res = await deleteCourse(courseId); 
      if (res.status === 200 || res.status === 204) {
        setCourses(courses.filter(c => c.id !== courseId));
        setSystemAlert({ type: 'success', text: 'Course channel de-indexed and all sub-vector matrices wiped completely.' });
        if (currentItems.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
      } else { 
        setSystemAlert({ type: 'error', text: 'Administrative override blocked: Unable to purge classroom channel.' }); 
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const getRoleClass = (role) => {
    switch(role) {
        case 'admin': return 'role-badge-admin';
        case 'teacher': return 'role-badge-teacher';
        default: return 'role-badge-student';
    }
  };

  return (
    <div className="au-page-wrapper">
      
      {/* ── 1. GLOBAL ADMIN HEADER CONSOLE ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <div className="au-hero-flex-split-row">
            <div className="au-hero-brand-text-block">
                <h1 className="adm-hero-main-title">System Administration Matrix</h1>
                <p className="adm-hero-subtitle">Audit workspace identities, regulate dynamic security clearances roles, and manage course catalog assets metadata registers.</p>
            </div>
            <button onClick={() => navigate(-1)} className="adm-btn-back au-btn-exit-override">
                ← Exit Admin Mode
            </button>
          </div>
        </div>
      </div>

      <div className="adm-content-workspace max-width-wide">
        
        {/* ── 2. SCORING KPIS MATRIX CARDS DECK ── */}
        <div className="sa-stats-grid-row adb-spaced-row-margin">
            <StatCard title="Global Accounts Count" value={users.length} icon="👥" variant="blue" />
            <StatCard title="Rostered Faculty Instructors" value={users.filter(u => u.role === 'teacher').length} icon="👨‍🏫" variant="purple" />
            <StatCard title="Indexed Catalog Courses" value={courses.length} icon="📚" variant="emerald" />
        </div>

        {/* ── 3. BATCH PROCESSING XLS/CSV HORIZONTAL CONTROLS COMPONENT ── */}
        <AdminBatchUpload onUploadSuccess={loadAllData} />
        
        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} au-spaced-alert-banner-margin`}>
            {systemAlert.text}
          </div>
        )}

        {/* ── 4. MAIN CENTRAL DIRECTORY DATA GRID CARD ── */}
        <div className="card au-directory-master-card-container">
            
            {/* COMPONENT TAB NAVIGATION BAR STRIP */}
            <div className="au-tabs-header-nav-row">
                <TabButton 
                    active={activeTab === 'users'} 
                    onClick={() => { setActiveTab('users'); setCurrentPage(1); }} 
                    label="User Identities Management" 
                />
                <TabButton 
                    active={activeTab === 'courses'} 
                    onClick={() => { setActiveTab('courses'); setCurrentPage(1); }} 
                    label="Course Catalog Registry" 
                />
            </div>

            {/* SECURE SUB-WORKSPACE INTERACTIVE TOOLBAR ROW */}
            <div className="au-toolbar-actions-flex-row">
                <p className="au-toolbar-pagination-counter-string">
                    Showing {dataToPaginate.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, dataToPaginate.length)} of {dataToPaginate.length} records computed
                </p>
                <input 
                    type="text" 
                    placeholder={activeTab === 'users' ? "Filter users by username or email..." : "Filter courses by title, instructor, or room location..."}
                    value={activeTab === 'users' ? userSearch : courseSearch}
                    onChange={(e) => {
                        activeTab === 'users' ? setUserSearch(e.target.value) : setCourseSearch(e.target.value);
                        setCurrentPage(1); 
                    }}
                    className="rp-input-field au-toolbar-search-input"
                />
            </div>

            {/* DIRECTORY MASTER VIEWPORTS TABLES LAYOUT */}
            <div className="adc-responsive-table-scroll-wrapper">
                <table className="adc-master-schedule-table">
                    <thead>
                        <tr>
                            {activeTab === 'users' ? (
                                <>
                                    <th>User Account Profile</th>
                                    <th>Assigned Security Role</th>
                                    <th className="adc-text-right">Actions Matrix</th>
                                </>
                            ) : (
                                <>
                                    <th>Class Curriculum Details</th>
                                    <th>Instructor Guide</th>
                                    <th className="adc-text-right">Actions Matrix</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" className="adc-table-empty-fallback-text">Syncing central directory storage records...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="3" className="adc-table-empty-fallback-text">No data metrics recorded mapping to active selection fields.</td></tr>
                        ) : (
                          currentItems.map(item => (
                            activeTab === 'users' ? (
                              <UserRow 
                                  key={item.id} 
                                  user={item} 
                                  onRoleChange={handleRoleChange} 
                                  onDelete={handleDeleteUser} 
                                  getRoleClass={getRoleClass} 
                              />
                            ) : (
                              <CourseRow 
                                  key={item.id} 
                                  course={item} 
                                  onDelete={handleDeleteCourse} 
                              />
                            )
                          ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* VIEWPORTS CARD FOOTER PAGINATION RAILS CONTROLS */}
            {totalPages > 1 && (
                <div className="au-pagination-footer-controls-strip">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="btn-secondary au-btn-pagination-node"
                    >
                        Previous Panel
                    </button>
                    <span className="au-pagination-numerical-string">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="btn-secondary au-btn-pagination-node"
                    >
                        Next Panel
                    </button>
                </div>
            )}
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .au-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        /* Hero Banner System */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        
        .au-hero-flex-split-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; position: relative; z-index: 2; }
        .au-hero-brand-text-block { display: flex; flex-direction: column; gap: 8px; }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin: 0; max-width: 700px; }
        
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .au-btn-exit-override { margin-bottom: 0; white-space: nowrap; height: fit-content; }

        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .adb-spaced-row-margin { margin-bottom: 8px; }
        
        /* Stats KPI Cards */
        .sa-stats-grid-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        .sa-stat-node-box { padding: 24px; }
        
        .au-stat-box-alignment-row { display: flex; justify-content: space-between; align-items: center; }
        .au-stat-box-left-content { display: flex; flex-direction: column; gap: 6px; }
        .au-stat-title-label-override { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .sa-stat-integer-value { font-size: 2.2rem; font-weight: 900; line-height: 1; margin: 0; }
        .text-color-default-dark { color: #0f172a; }
        .au-stat-box-right-emoji-art { font-size: 2.5rem; line-height: 1; opacity: 0.8; }
        
        .box-accent-border-blue { border-top: 4px solid #3b82f6; }
        .box-accent-border-purple { border-top: 4px solid #a855f7; }
        .box-accent-border-emerald { border-top: 4px solid #10b981; }

        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .au-spaced-alert-banner-margin { margin-bottom: 0px; }

        /* Master Directory Card */
        .au-directory-master-card-container { display: flex; flex-direction: column; }
        
        .au-tabs-header-nav-row { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 0 10px; overflow-x: auto; }
        .au-tab-button-node-item { background: transparent; border: none; padding: 16px 20px; font-size: 0.95rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; white-space: nowrap; font-family: inherit; }
        .au-tab-button-node-item:hover { color: #0f172a; }
        .active-tab-button-indicator-state { color: #4f46e5 !important; border-bottom-color: #4f46e5 !important; font-weight: 700 !important; }

        .au-toolbar-actions-flex-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; padding: 20px; border-bottom: 1px solid #f1f5f9; }
        .au-toolbar-pagination-counter-string { margin: 0; font-size: 0.85rem; color: #64748b; font-weight: 500; }
        .au-toolbar-search-input { min-width: 320px; flex-grow: 1; max-width: 400px; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.2s; font-family: inherit; }
        .au-toolbar-search-input:focus { border-color: #4f46e5; }

        /* Table Formatting */
        .adc-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; }
        .adc-master-schedule-table { width: 100%; border-collapse: collapse; text-align: left; }
        .adc-master-schedule-table th { padding: 16px 20px; background-color: #f8fafc; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap; }
        .adc-master-schedule-table td { vertical-align: middle; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
        
        .adc-table-tr-node:hover { background-color: #f8fafc; transition: background-color 0.15s; }
        .adc-table-tr-node:last-child td { border-bottom: none; }
        .adc-table-empty-fallback-text { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 500; font-size: 0.95rem; }

        .adc-td-primary-title-block { display: flex; flex-direction: column; gap: 4px; }
        .adc-course-main-string-title { font-weight: 800; color: #0f172a; font-size: 0.95rem; line-height: 1.2; }
        .sa-text-muted { color: #64748b; }
        .text-micro { font-size: 0.8rem; }
        .font-weight-500 { font-weight: 500; }
        .adc-text-right { text-align: right; }
        
        .adc-course-meta-sub-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .m-top-6 { margin-top: 6px; }
        
        /* Badges & Selects */
        .rt-badge { padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 0.7rem; letter-spacing: 0.05em; border: 1px solid transparent; display: inline-block; white-space: nowrap; }
        .rt-badge-quiz { background-color: #f1f5f9; color: #475569; border-color: #e2e8f0; }
        .rt-badge-lecture { background-color: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
        .text-transform-uppercase-override { text-transform: uppercase; }

        .select-cursor-pointer { cursor: pointer; }
        .au-select-inline-role-editor { padding: 6px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 700; border: 1px solid #cbd5e1; outline: none; transition: all 0.2s; font-family: inherit; }
        
        .role-badge-admin { background-color: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .role-badge-teacher { background-color: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }
        .role-badge-student { background-color: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        /* Buttons */
        .btn-danger { background: #ffffff; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .btn-danger:hover { background: #fef2f2; border-color: #fca5a5; }
        .au-btn-danger-row-delete-override { white-space: nowrap; }

        .au-pagination-footer-controls-strip { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .btn-secondary { background-color: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .btn-secondary:hover:not(:disabled) { background-color: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .au-btn-pagination-node { white-space: nowrap; }
        .au-pagination-numerical-string { font-size: 0.85rem; font-weight: 600; color: #475569; }

        /* Layout Revisions */
        .lc-info-block { display: flex; flex-direction: column; gap: 4px; }
        .adc-td-instructor-text-cell { font-weight: 700; color: #1e293b; font-size: 0.9rem; }

        @media (max-width: 640px) {
          .au-hero-flex-split-row { flex-direction: column; align-items: stretch; gap: 16px; }
          .au-btn-exit-override { text-align: center; }
          .au-toolbar-actions-flex-row { flex-direction: column; align-items: stretch; }
          .au-toolbar-search-input { max-width: 100%; min-width: 100%; }
        }
      `}</style>
    </div>
  );
};

// ─── DIRECTORY TRACKING SUB-COMPONENTS DECKS ─────────────────────────────────

const StatCard = ({ title, value, icon, variant }) => (
  <div className={`card sa-stat-node-box box-accent-border-${variant} au-stat-box-alignment-row`}>
    <div className="au-stat-box-left-content">
      <p className="sa-stat-header-flex au-stat-title-label-override">{title}</p>
      <h3 className="sa-stat-integer-value text-color-default-dark">{value || 0}</h3>
    </div>
    <div className="au-stat-box-right-emoji-art">{icon}</div>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`au-tab-button-node-item ${active ? 'active-tab-button-indicator-state' : ''}`}
  >
    {label}
  </button>
);

const UserRow = ({ user, onRoleChange, onDelete, getRoleClass }) => (
  <tr className="adc-table-tr-node">
    <td className="adc-td-primary-title-block">
      <div className="adc-course-main-string-title">{user.username}</div>
      <div className="sa-text-muted text-micro font-weight-500">{user.email}</div>
    </td>
    <td>
      <select
        value={user.role}
        onChange={(e) => onRoleChange(user.id, e.target.value)}
        className={`rp-input-field select-cursor-pointer au-select-inline-role-editor ${getRoleClass(user.role)}`}
      >
        <option value="student">Student Account</option>
        <option value="teacher">Faculty Guide</option>
      </select>
    </td>
    <td className="adc-text-right">
      <button onClick={() => onDelete(user.id, user.username)} className="btn-danger au-btn-danger-row-delete-override">
        Delete
      </button>
    </td>
  </tr>
);

const CourseRow = ({ course, onDelete }) => (
  <tr className="adc-table-tr-node">
    <td className="adc-td-primary-title-block">
      <div className="adc-course-main-string-title">{course.name}</div>
      <div className="adc-course-meta-sub-row m-top-6">
        {course.course_catalog_code && <span className="rt-badge rt-badge-quiz">{course.course_catalog_code}</span>}
        {course.semester_code && <span className="rt-badge rt-badge-lecture text-transform-uppercase-override">{course.semester_code}</span>}
      </div>
    </td>
    <td>
      <div className="lc-info-block">
        <div className="adc-td-instructor-text-cell">{course.teacher_name || "Unassigned Faculty Guide"}</div>
        <div className="sa-text-muted text-micro">{course.teacher_email || "No secure linkage email logged"}</div>
      </div>
    </td>
    <td className="adc-text-right">
      <button onClick={() => onDelete(course.id, course.name)} className="btn-danger au-btn-danger-row-delete-override">
        Delete
      </button>
    </td>
  </tr>
);

export default AdminUsers;