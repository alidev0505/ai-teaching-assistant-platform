import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { updateProfile, getProfileStats, changePassword } from '../services/api';

// ─── Shared Core Configurations ──────────────────────────────────────────────
const ROLE_META = {
  student: { label: 'Student', color: '#2563eb', icon: '🎓' },
  teacher: { label: 'Teacher', color: '#7c3aed', icon: '👨‍🏫' },
  admin: { label: 'Admin', color: '#dc2626', icon: '🛡️' },
};

const DEPARTMENTS = [
  'Computer Science', 'Software Engineering', 'Information Technology',
  'Artificial Intelligence', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Accounting & Finance',
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English Literature', 'Economics', 'Psychology', 'Other',
];

const GEN_TYPES = [
  { key: 'lecture', label: 'Lecture Notes', icon: '📖', type: 'lecture' },
  { key: 'slides', label: 'Slides', icon: '🖼️', type: 'slides' },
  { key: 'assignment', label: 'Assignments', icon: '📝', type: 'assignment' },
  { key: 'quiz', label: 'Quizzes', icon: '🧩', type: 'quiz' },
  { key: 'midterm', label: 'Mid-Terms', icon: '📋', type: 'midterm' },
  { key: 'final', label: 'Final Exams', icon: '🎓', type: 'final' },
];

// ─── Main Component Profile Workspace ─────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileRef = useRef();
  const meta = ROLE_META[user?.role] || ROLE_META.student;

  // Form states
  const [form, setForm] = useState({
    username: '', email: '', university_id: '',
    department: '', bio: '', profile_picture: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Security password parameters
  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // System statistics metrics tracking states
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        university_id: user.university_id || '',
        department: user.department || '',
        bio: user.bio || '',
        profile_picture: user.profile_picture || '',
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try { 
      const r = await getProfileStats(); 
      setStats(r?.data?.stats || null); 
    } catch (err) { 
      console.error("Failed to sync structural profile dashboard metrics.", err);
    }
  };

  // ── High Performance Image Buffer Loading ─────────────────────────────────
  const handlePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Target file limit warning: Image footprint must remain under 2 MB.');
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev?.target?.result) {
        setForm(f => ({ ...f, profile_picture: ev.target.result }));
      }
    };
    reader.onerror = () => alert('Processing Error: Stalled reading target image binary data streams.');
    reader.readAsDataURL(file);
  };

  // ── Profile Modification Handlers ──────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setSaveMsg(null);
    try {
      const res = await updateProfile(form);
      setSaveMsg({ type: 'success', text: 'Personal profile records verified and updated successfully!' });
      if (res?.data?.user && setUser) setUser(prev => ({ ...prev, ...res.data.user }));
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.error || 'System transaction failure: Unable to write data changes.' });
    } finally { 
      setSaving(false); 
    }
  };

  // ── Password Credential Handlers ───────────────────────────────────────────
  const handlePw = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.confirm) {
      return setPwMsg({ type: 'error', text: 'Verification failure: Security entry tokens do not match.' });
    }
    if (pw.new_password.length < 6) {
      return setPwMsg({ type: 'error', text: 'Complexity validation error: Passwords must contain at least 6 characters.' });
    }
    setPwSaving(true); 
    setPwMsg(null);
    try {
      await changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      setPwMsg({ type: 'success', text: 'Credential matrix updated successfully!' });
      setPw({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Authorization failure: Stalled executing password modifications.' });
    } finally { 
      setPwSaving(false); 
    }
  };

  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student';
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'AI';
  const hasPic = !!form.profile_picture;

  const tabs = [
    { key: 'info', label: '👤 Profile' },
    { key: 'password', label: '🔒 Security' },
    { key: 'courses', label: user?.role === 'teacher' ? '📚 My Courses' : '📖 Courses' },
    ...(user?.role === 'teacher' ? [{ key: 'generated', label: '🤖 AI Stats' }] : []),
  ];

  return (
    <div className="pr-page-wrapper">

      {/* ── CENTRAL HERO LAYER BLOCK ── */}
      <div className="pr-hero-banner">
        <div className="pr-grid-mesh" />
        <div className="pr-hero-container">
          <button onClick={() => navigate(dashLink)} className="pr-btn-back">
            ← Back to Dashboard
          </button>

          <div className="pr-avatar-row">
            <div className="pr-avatar-frame-wrapper">
              <div className="pr-avatar-circle-frame">
                {hasPic ? (
                  <img src={form.profile_picture} alt="User Avatar Profile" className="pr-avatar-image" />
                ) : (
                  <span className="pr-avatar-initials-text">{initials}</span>
                )}
              </div>

              <button 
                onClick={() => { setTab('info'); setTimeout(() => fileRef.current?.click(), 100); }} 
                className="pr-btn-camera-trigger" 
                title="Change system photo avatar"
              >
                📷
              </button>
            </div>

            <div className="pr-user-meta-block">
              <div className="pr-meta-title-row">
                <h1 className="pr-user-name-title">{user?.username}</h1>
                <span className={`pr-role-badge role-type-${user?.role || 'student'}`}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <p className="pr-user-email-text">{user?.email}</p>
              {form.department && <p className="pr-user-dept-text">🏛️ {form.department}</p>}
              <p className="pr-user-timestamp-text">Member since {user?.created_at || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE OPERATIONS VIEWWORK PANEL DECK ── */}
      <div className="pr-content-workspace">

        {/* Dynamic Multi-role Status Dashboard Aggregations */}
        {stats && (
          <div className="pr-stats-metrics-flex-row">
            {user?.role === 'teacher' && [
              { icon: '📚', label: 'Courses Managed', value: stats.courses_taught, tag: 'primary' },
              { icon: '👥', label: 'Total Roster Students', value: stats.total_students, tag: 'success' },
              { icon: '🤖', label: 'AI Documents Generated', value: stats.generated ? Object.values(stats.generated).reduce((a, b) => a + b, 0) : 0, tag: 'purple' },
            ].map(s => (
              <div key={s.label} className={`pr-metric-card stat-variant-${s.tag}`}>
                <div className="pr-metric-icon">{s.icon}</div>
                <div className="pr-metric-value">{s.value}</div>
                <div className="pr-metric-label">{s.label}</div>
              </div>
            ))}

            {user?.role === 'student' && [
              { icon: '📖', label: 'Active Enrolled Channels', value: stats.courses_enrolled, tag: 'primary' },
              { icon: '🪪', label: 'University Verification ID', value: form.university_id || '—', tag: 'purple' },
              { icon: '✅', label: 'Account Verified Badge', value: user?.is_verified ? 'Yes' : 'No', tag: 'success' },
            ].map(s => (
              <div key={s.label} className={`pr-metric-card stat-variant-${s.tag}`}>
                <div className="pr-metric-icon">{s.icon}</div>
                <div className="pr-metric-value text-medium">{s.value}</div>
                <div className="pr-metric-label">{s.label}</div>
              </div>
            ))}

            {user?.role === 'admin' && [
              { icon: '👥', label: 'Total Base Users', value: stats.total_users, tag: 'primary' },
              { icon: '👨‍🏫', label: 'Active Instructors', value: stats.total_teachers, tag: 'purple' },
              { icon: '🎓', label: 'Enrolled Students', value: stats.total_students, tag: 'success' },
              { icon: '📚', label: 'Indexed Core Syllabus Channels', value: stats.total_courses, tag: 'amber' },
            ].map(s => (
              <div key={s.label} className={`pr-metric-card stat-variant-${s.tag}`}>
                <div className="pr-metric-icon">{s.icon}</div>
                <div className="pr-metric-value">{s.value}</div>
                <div className="pr-metric-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Selection Row Switcher */}
        <div className="pr-tabs-navigation-strip">
          {tabs.map(t => (
            <button 
              key={t.key} 
              onClick={() => setTab(t.key)} 
              className={`pr-tab-trigger-btn ${tab === t.key ? 'active-tab-state' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB MODULE: PERSONAL DATA VIEWWORK ── */}
        {tab === 'info' && (
          <div className="pr-tab-display-card-panel">
            <h3 className="pr-panel-inner-heading">Personal Information</h3>

            {saveMsg && <div className={`auth-alert ${saveMsg.type === 'success' ? 'success' : 'error'}`}>{saveMsg.text}</div>}

            <input ref={fileRef} type="file" accept="image/*" className="display-hidden-input" onChange={handlePicture} />

            <div className="pr-pic-uploader-row-card">
              <div className="pr-uploader-circle-preview">
                {hasPic ? (
                  <img src={form.profile_picture} alt="Avatar Frame Preview" className="pr-uploader-image" />
                ) : (
                  <span className="pr-uploader-initials-text">{initials}</span>
                )}
              </div>
              <div className="pr-uploader-controls-block">
                <p className="pr-uploader-card-title">Profile Avatar Record</p>
                <p className="pr-uploader-card-subtitle">Accepts JPG, PNG dimensions up to 2 MB maximum allocation footprint sizes safely.</p>
                <div className="pr-uploader-action-button-group">
                  <button type="button" onClick={() => fileRef.current?.click()} className="pr-btn-upload-file-submit">
                    Upload New Image
                  </button>
                  {hasPic && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, profile_picture: '' }))} className="pr-btn-remove-avatar-purgatory">
                      Remove File
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="pr-structured-form-layout">
              <div className="pr-form-grid-layout-row-2">
                <div className="auth-form-group">
                  <label className="pr-input-form-label">Full Registration Name</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="rp-input-field" required />
                </div>
                <div className="auth-form-group">
                  <label className="pr-input-form-label">Email Communications Address</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rp-input-field" required />
                </div>
              </div>

              <div className="pr-form-grid-layout-row-2">
                <div className="auth-form-group">
                  <label className="pr-input-form-label">Academic Faculty Department</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="rp-input-field select-cursor-pointer">
                    <option value="">— Select Assigned Department Workgroup —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {user?.role === 'student' && (
                  <div className="auth-form-group">
                    <label className="pr-input-form-label">University Identity Code / Roll Number</label>
                    <input value={form.university_id} onChange={e => setForm({ ...form, university_id: e.target.value })} placeholder="e.g., BAI-22F-123" className="rp-input-field" />
                  </div>
                )}
              </div>

              <div className="auth-form-group">
                <label className="pr-input-form-label">Professional Bio / Profile Description</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({ ...form, bio: e.target.value })} 
                  rows={3}
                  placeholder={user?.role === 'teacher' ? 'Briefly describe your specialization focus domains or office hours schedules…' : 'Share a concise introductory snapshot background summary…'}
                  className="rp-input-field textarea-vertical-resize-lock" 
                />
              </div>

              <div className="pr-metadata-read-only-row-ledger">
                {[
                  { label: 'Security Role Access', value: user?.role?.toUpperCase() },
                  { label: 'Cloud Node Provision Time', value: user?.created_at || '—' },
                  { label: 'Verified Profile Status', value: user?.is_verified ? 'Authenticated Profile' : 'Awaiting Email Check' },
                ].map(item => (
                  <div key={item.label} className="pr-metadata-item-node">
                    <div className="pr-meta-item-label-header">{item.label}</div>
                    <div className="pr-meta-item-value-text">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="pr-form-footer-action-row">
                <button type="submit" disabled={saving} className="btn-primary pr-btn-save-submit">
                  {saving ? 'Processing Matrix Save...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB MODULE: SYSTEM SECURITY OVERHAUL ── */}
        {tab === 'password' && (
          <div className="pr-tab-display-card-panel">
            <h3 className="pr-panel-inner-heading">Change Account Password</h3>
            <p className="pr-panel-inner-subtitle">Ensure cryptographic credential safety parameters by generating randomized uppercase, numeric, and character symbols arrays.</p>
            
            {pwMsg && <div className={`auth-alert ${pwMsg.type === 'success' ? 'success' : 'error'}`}>{pwMsg.text}</div>}
            
            <form onSubmit={handlePw} className="pr-structured-form-layout">
              <div className="auth-form-group">
                <label className="pr-input-form-label">Current Authentication Password</label>
                <input type="password" placeholder="Enter current baseline password token" value={pw.old_password} onChange={e => setPw({ ...pw, old_password: e.target.value })} className="rp-input-field" required />
              </div>
              
              <div className="pr-form-grid-layout-row-2">
                <div className="auth-form-group">
                  <label className="pr-input-form-label">New Password Selection Target</label>
                  <input type="password" placeholder="Minimum 6 characters scale array" value={pw.new_password} onChange={e => setPw({ ...pw, new_password: e.target.value })} className="rp-input-field" required />
                </div>
                <div className="auth-form-group">
                  <label className="pr-input-form-label">Confirm New Password Entry</label>
                  <input 
                    type="password" 
                    placeholder="Re-enter password selection target string" 
                    value={pw.confirm} 
                    onChange={e => setPw({ ...pw, confirm: e.target.value })} 
                    className={`rp-input-field ${pw.confirm && pw.new_password !== pw.confirm ? 'input-validation-border-error' : ''}`}
                    required 
                  />
                  {pw.confirm && pw.new_password !== pw.confirm && (
                    <p className="pr-field-level-alert-text">⚠️ Passwords entry sequences do not match.</p>
                  )}
                </div>
              </div>

              <div className="pr-form-footer-action-row">
                <button type="submit" disabled={pwSaving} className="btn-primary pr-btn-save-submit">
                  {pwSaving ? 'Executing Refactor...' : 'Update Password Credentials'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB MODULE: ACADEMIC ACTIVE SYLLABUS WORKGROUPS ── */}
        {tab === 'courses' && (
          <div className="pr-tab-display-card-panel">
            <h3 className="pr-panel-inner-heading">
              {user?.role === 'teacher' ? 'Active Faculty Course Directives' : 'My Enrolled Class Units'}
            </h3>
            
            {(!stats?.courses || stats.courses.length === 0) ? (
              <div className="pr-empty-roster-state-box">
                <div className="pr-empty-box-art">📭</div>
                <p className="pr-empty-box-message-prompt">{user?.role === 'teacher' ? 'No academic channels found cataloged to your instructor credential signatures yet.' : 'Your account portfolio isn\'t linked to any courses yet.'}</p>
              </div>
            ) : (
              <div className="pr-course-link-deck-stack">
                {stats.courses.map((c, i) => {
                  const styleVariations = ['blue', 'cyan', 'emerald', 'orange', 'red', 'purple'];
                  const colorTag = styleVariations[i % styleVariations.length];
                  return (
                    <Link key={c.id} to={`/course/${c.id}`} className={`pr-course-anchor-card border-accent-highlight-${colorTag}`}>
                      <div className={`pr-course-icon-avatar font-avatar-variant-${colorTag}`}>📚</div>
                      <div className="pr-course-text-details-wrapper">
                        <div className="pr-course-inner-title">{c.name}</div>
                        {user?.role === 'student' && c.teacher && <div className="pr-course-inner-instructor-subtext">👤 Instructor: {c.teacher}</div>}
                      </div>
                      <span className={`pr-course-inline-code-badge tag-variant-${colorTag}`}>{c.code}</span>
                      <span className="pr-course-arrow-indicator">→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB MODULE: AI GENERATION INVENTORY MATRIX (TEACHER SPECIFIC) ── */}
        {tab === 'generated' && user?.role === 'teacher' && (
          <div className="pr-tab-display-card-panel">
            <h3 className="pr-panel-inner-heading">🤖 AI RAG Content Tracking Summary</h3>
            <p className="pr-panel-inner-subtitle">Granular data inventory monitoring across all vector database split calculations, educational documents, and auto-generated content evaluation materials.</p>
            
            <div className="pr-ai-generation-matrix-grid">
              {GEN_TYPES.map(gt => {
                const count = stats?.generated?.[gt.key] ?? 0;
                return (
                  <div key={gt.key} className={`pr-ai-card matrix-theme-${gt.type}`}>
                    <div className="pr-ai-card-header-metric-row">
                      <span className="pr-ai-card-art-logo">{gt.icon}</span>
                      <span className="pr-ai-card-integer-counter">{count}</span>
                    </div>
                    <div className="pr-ai-card-label-string">{gt.label}</div>
                    <div className="pr-ai-card-inventory-subtext">{count === 1 ? '1 index file' : `${count} verified sets`} parsed</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;