import React, { useState, useContext, useRef, useEffect } from 'react';
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

            <input ref={fileRef} type="file" accept="image/*" className="display-hidden-input" style={{ display: 'none' }} onChange={handlePicture} />

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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .pr-page-wrapper { background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .pr-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 36px 0 100px; position: relative; overflow: hidden; }
        .pr-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; }
        .pr-hero-container { max-width: 900px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .pr-btn-back { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.9); border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 7px; cursor: pointer; font-size: 0.82rem; margin-bottom: 22px; font-weight: 600; transition: all 0.2s ease; }
        .pr-btn-back:hover { background: rgba(255, 255, 255, 0.2); color: #ffffff; }
        
        .pr-avatar-row { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .pr-avatar-frame-wrapper { position: relative; flex-shrink: 0; }
        .pr-avatar-circle-frame { width: 88px; height: 88px; border-radius: 50%; background: rgba(255, 255, 255, 0.12); border: 3px solid rgba(255, 255, 255, 0.3); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2); }
        .pr-avatar-image, .pr-uploader-image { width: 100%; height: 100%; object-fit: cover; }
        .pr-avatar-initials-text { color: #ffffff; font-size: 2rem; font-weight: 900; }
        
        .pr-btn-camera-trigger { position: absolute; bottom: 0; right: 0; width: 28px; height: 28px; border-radius: 50%; background: #ffffff; border: 2px solid #e2e8f0; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); transition: transform 0.2s ease; border: none; }
        .pr-btn-camera-trigger:hover { transform: scale(1.08); }
        
        .pr-user-meta-block { color: #ffffff; }
        .pr-meta-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
        .pr-user-name-title { font-size: 1.85rem; font-weight: 900; margin: 0; letter-spacing: -0.6px; }
        
        .pr-role-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.725rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .pr-role-badge.role-type-student { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .pr-role-badge.role-type-teacher { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
        .pr-role-badge.role-type-admin { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        
        .pr-user-email-text { color: rgba(255, 255, 255, 0.75); margin: 0 0 4px; font-size: 0.9rem; font-weight: 500; }
        .pr-user-dept-text { color: rgba(255, 255, 255, 0.65); margin: 0; font-size: 0.85rem; font-weight: 500; }
        .pr-user-timestamp-text { color: rgba(255, 255, 255, 0.4); margin: 4px 0 0; font-size: 0.8rem; font-weight: 500; }
        
        /* Metrics Scoreboard Rails Panels */
        .pr-content-workspace { max-width: 900px; margin: -56px auto 0; padding: 0 24px 60px; position: relative; z-index: 10; }
        .pr-stats-metrics-flex-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .pr-metric-card { flex: 1; min-width: 150px; border-radius: 14px; padding: 16px 20px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0; }
        .pr-metric-card.stat-variant-primary { background: #eff6ff; border-color: rgba(37, 99, 235, 0.12); color: #2563eb; }
        .pr-metric-card.stat-variant-success { background: #f0fdf4; border-color: rgba(5, 150, 105, 0.12); color: #059669; }
        .pr-metric-card.stat-variant-purple { background: #f5f3ff; border-color: rgba(124, 58, 237, 0.12); color: #7c3aed; }
        .pr-metric-card.stat-variant-amber { background: #fffbeb; border-color: rgba(217, 119, 6, 0.12); color: #d97706; }
        
        .pr-metric-icon { font-size: 1.4rem; margin-bottom: 4px; }
        .pr-metric-value { font-size: 1.6rem; font-weight: 900; line-height: 1; margin-bottom: 4px; }
        .pr-metric-value.text-medium { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.3px; line-height: 1.3; }
        .pr-metric-label { font-size: 0.725rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        
        /* Navigation Controls & Inner Panels Setup */
        .pr-tabs-navigation-strip { display: flex; gap: 4px; background: #ffffff; padding: 5px; border-radius: 11px; border: 1px solid #e2e8f0; margin-bottom: 20px; width: fit-content; box-shadow: 0 2px 4px rgba(0,0,0,0.02); flex-wrap: wrap; }
        .pr-tab-trigger-btn { padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; font-size: 0.85rem; background: transparent; color: #64748b; font-family: inherit; transition: all 0.2s ease; }
        .pr-tab-trigger-btn.active-tab-state { background: linear-gradient(135deg, #1d4ed8, #0284c7); color: #ffffff; box-shadow: 0 4px 10px rgba(29, 78, 216, 0.2); }
        
        .pr-tab-display-card-panel { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; animation: fadeIn 0.2s ease-out; }
        .pr-panel-inner-heading { margin: 0 0 20px; color: #0f172a; font-weight: 800; font-size: 1.15rem; padding-bottom: 14px; border-bottom: 1px solid #f1f5f9; letter-spacing: -0.3px; }
        .pr-panel-inner-subtitle { color: #64748b; font-size: 0.875rem; margin: -12px 0 24px 0; line-height: 1.5; font-weight: 500; }
        
        /* Pic Upload Blocks Layout */
        .pr-pic-uploader-row-card { display: flex; align-items: center; gap: 20px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 24px; }
        .pr-uploader-circle-preview { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; border: 2px solid #e2e8f0; flex-shrink: 0; background: #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .pr-uploader-initials-text { font-size: 1.5rem; font-weight: 800; color: #94a3b8; }
        .pr-uploader-controls-block { display: flex; flex-direction: column; }
        .pr-uploader-card-title { margin: 0 0 4px; font-weight: 800; color: #0f172a; font-size: 0.9rem; }
        .pr-uploader-card-subtitle { margin: 0 0 12px; color: #64748b; font-size: 0.8rem; line-height: 1.4; font-weight: 500; }
        .pr-uploader-action-button-group { display: flex; gap: 8px; flex-wrap: wrap; }
        
        .pr-btn-upload-file-submit { background: linear-gradient(135deg, #1d4ed8, #0284c7); color: #ffffff; border: none; padding: 8px 16px; border-radius: 7px; cursor: pointer; font-weight: 700; font-size: 0.8rem; font-family: inherit; transition: opacity 0.2s; }
        .pr-btn-remove-avatar-purgatory { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 8px 16px; border-radius: 7px; cursor: pointer; font-weight: 700; font-size: 0.8rem; font-family: inherit; transition: background 0.2s; }
        .pr-btn-upload-file-submit:hover, .pr-btn-remove-avatar-purgatory:hover { opacity: 0.9; }
        
        /* Structured Form Configurations Fields Controls */
        .pr-structured-form-layout { display: flex; flex-direction: column; gap: 16px; }
        .pr-form-grid-layout-row-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .pr-input-form-label { display: block; margin-bottom: 6px; font-weight: 700; color: #475569; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .pr-metadata-read-only-row-ledger { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; margin-top: 6px; }
        .pr-metadata-item-node { display: flex; flex-direction: column; gap: 2px; }
        .pr-meta-item-label-header { font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .pr-meta-item-value-text { font-weight: 700; color: #475569; font-size: 0.85rem; }
        .pr-form-footer-action-row { display: flex; justify-content: flex-end; padding-top: 6px; }
        
        .pr-btn-save-submit { border: none; padding: 12px 28px; border-radius: 10px; font-weight: 800; font-size: 0.9rem; font-family: inherit; cursor: pointer; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25); background-color: #4f46e5; color: white; transition: background-color 0.2s; }
        .pr-btn-save-submit:hover:not(:disabled) { background-color: #4338ca; }
        .pr-btn-save-submit:disabled { background: #cbd5e1 !important; color: #94a3b8 !important; cursor: not-allowed; box-shadow: none !important; }
        
        .input-validation-border-error { border-color: #dc2626 !important; }
        .pr-field-level-alert-text { color: #dc2626; font-size: 0.78rem; margin-top: 4px; font-weight: 600; }
        .select-cursor-pointer { cursor: pointer; height: 44px; background-color: #ffffff; }
        .textarea-vertical-resize-lock { resize: vertical; min-height: 90px; line-height: 1.5; }
        
        /* Empty states blocks */
        .pr-empty-roster-state-box { text-align: center; padding: 50px 20px; color: #94a3b8; }
        .pr-empty-box-art { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; line-height: 1; }
        .pr-empty-box-message-prompt { font-size: 0.9rem; font-weight: 600; color: #64748b; }
        
        /* Course Links List Panels anchor stack */
        .pr-course-link-deck-stack { display: flex; flex-direction: column; gap: 10px; }
        .pr-course-anchor-card { text-decoration: none; display: flex; align-items: center; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; transition: all 0.2s ease; }
        .pr-course-anchor-card:hover { transform: translateX(2px); background: #ffffff; }
        .pr-course-icon-avatar { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .pr-course-text-details-wrapper { flex: 1; min-width: 0; }
        .pr-course-inner-title { font-weight: 700; color: #0f172a; font-size: 0.925rem; letter-spacing: -0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pr-course-inner-instructor-subtext { font-size: 0.78rem; color: #64748b; margin-top: 2px; font-weight: 500; }
        .pr-course-inline-code-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 800; flex-shrink: 0; }
        .pr-course-arrow-indicator { color: #94a3b8; font-size: 0.85rem; font-weight: 700; }
        
        .border-accent-highlight-blue:hover { border-color: #2563eb; } .font-avatar-variant-blue { background: rgba(37, 99, 235, 0.08); } .tag-variant-blue { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .border-accent-highlight-cyan:hover { border-color: #0891b2; } .font-avatar-variant-cyan { background: rgba(8, 145, 178, 0.08); } .tag-variant-cyan { background: rgba(8, 145, 178, 0.08); color: #0891b2; }
        .border-accent-highlight-emerald:hover { border-color: #059669; } .font-avatar-variant-emerald { background: rgba(5, 150, 105, 0.08); } .tag-variant-emerald { background: rgba(5, 150, 105, 0.08); color: #059669; }
        .border-accent-highlight-orange:hover { border-color: #d97706; } .font-avatar-variant-orange { background: rgba(217, 119, 6, 0.08); } .tag-variant-orange { background: rgba(217, 119, 6, 0.08); color: #d97706; }
        .border-accent-highlight-red:hover { border-color: #dc2626; } .font-avatar-variant-red { background: rgba(220, 38, 38, 0.08); } .tag-variant-red { background: rgba(220, 38, 38, 0.08); color: #dc2626; }
        .border-accent-highlight-purple:hover { border-color: #7c3aed; } .font-avatar-variant-purple { background: rgba(124, 58, 237, 0.08); } .tag-variant-purple { background: rgba(124, 58, 237, 0.08); color: #7c3aed; }
        
        /* AI Generation Telemetry Monitoring Grid */
        .pr-ai-generation-matrix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
        .pr-ai-card { border-radius: 14px; padding: 22px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); display: flex; flex-direction: column; }
        .pr-ai-card-header-metric-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .pr-ai-card-art-logo { font-size: 1.8rem; line-height: 1; }
        .pr-ai-card-integer-counter { background: #ffffff; font-weight: 900; font-size: 1.3rem; padding: 4px 12px; border-radius: 8px; line-height: 1; }
        .pr-ai-card-label-string { font-weight: 800; color: #0f172a; font-size: 0.9rem; }
        .pr-ai-card-inventory-subtext { font-size: 0.75rem; color: #64748b; margin-top: 4px; font-weight: 500; }
        
        .matrix-theme-lecture { background: #eff6ff; border: 1px solid rgba(37, 99, 235, 0.12); } .matrix-theme-lecture .pr-ai-card-integer-counter { color: #2563eb; border: 1px solid rgba(37, 99, 235, 0.12); }
        .matrix-theme-slides { background: #ecfeff; border: 1px solid rgba(8, 145, 178, 0.12); } .matrix-theme-slides .pr-ai-card-integer-counter { color: #0891b2; border: 1px solid rgba(8, 145, 178, 0.12); }
        .matrix-theme-assignment { background: #f0fdf4; border: 1px solid rgba(5, 150, 105, 0.12); } .matrix-theme-assignment .pr-ai-card-integer-counter { color: #059669; border: 1px solid rgba(5, 150, 105, 0.12); }
        .matrix-theme-quiz { background: #f5f3ff; border: 1px solid rgba(124, 58, 237, 0.12); } .matrix-theme-quiz .pr-ai-card-integer-counter { color: #7c3aed; border: 1px solid rgba(124, 58, 237, 0.12); }
        .matrix-theme-midterm { background: #fffbeb; border: 1px solid rgba(217, 119, 6, 0.12); } .matrix-theme-midterm .pr-ai-card-integer-counter { color: #d97706; border: 1px solid rgba(217, 119, 6, 0.12); }
        .matrix-theme-final { background: #fef2f2; border: 1px solid rgba(220, 38, 38, 0.12); } .matrix-theme-final .pr-ai-card-integer-counter { color: #dc2626; border: 1px solid rgba(220, 38, 38, 0.12); }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; margin-bottom: 16px; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Mobile Device Breakpoint Scales Shifters */
        @media (max-width: 768px) {
          .pr-avatar-row { flex-direction: column; text-align: center; justify-content: center; gap: 16px; }
          .pr-meta-title-row { justify-content: center; }
          .pr-user-meta-block { display: flex; flex-direction: column; align-items: center; }
          .pr-stats-metrics-flex-row { flex-direction: column; align-items: stretch; }
          .pr-tabs-navigation-strip { width: 100%; justify-content: center; }
          .pr-tab-trigger-btn { flex: 1; text-align: center; padding: 8px 4px; font-size: 0.75rem; }
          .pr-tab-display-card-panel { padding: 20px; }
          .pr-pic-uploader-row-card { flex-direction: column; text-align: center; }
          .pr-uploader-action-button-group { justify-content: center; width: 100%; }
          .pr-uploader-action-button-group button { flex: 1; }
        }
      `}</style>
    </div>
  );
};

export default Profile;