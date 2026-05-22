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