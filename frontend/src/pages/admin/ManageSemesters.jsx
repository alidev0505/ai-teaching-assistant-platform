import React, { useState, useEffect } from 'react';
import { createSemester, getSemesters, toggleSemester } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ManageSemesters = () => {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [form, setForm] = useState({ name: 'Fall', academic_year: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      const res = await getSemesters();
      setSemesters(res?.data?.semesters || []);
    } catch (err) {
      console.error("Failed to synchronize academic calendar datasets.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSystemAlert({ type: '', text: '' });

    if (!form.academic_year.trim()) {
      return setSystemAlert({ type: 'error', text: 'Validation Error: Academic year parameters required.' });
    }

    try {
      await createSemester({
        name: form.name,
        academic_year: form.academic_year.trim(),
        start_date: form.start_date,
        end_date: form.end_date
      });
      setSystemAlert({ type: 'success', text: '🚀 New academic semester initialized and mapped successfully!' });
      setForm({ name: 'Fall', academic_year: '', start_date: '', end_date: '' }); 
      loadData();
    } catch (err) { 
      setSystemAlert({ type: 'error', text: 'Creation Disruption: Stalled writing semester configuration fields.' }); 
    }
  };

  const handleToggle = async (id) => {
    setSystemAlert({ type: '', text: '' });
    try {
      await toggleSemester(id);
      loadData();
    } catch (err) {
      setSystemAlert({ type: 'error', text: 'Override Failure: Failed to update operational active status.' });
    }
  };

  return (
    <div className="ms-page-wrapper">
      
      {/* ── HERO BANNER HEADER CONSOLE ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <button onClick={() => navigate(-1)} className="adm-btn-back">← Back</button>
          <h1 className="adm-hero-main-title">Semester Term Management</h1>
          <p className="adm-hero-subtitle">Configure institutional academic calendars, partition calendar tracks, and regulate active sessions.</p>
        </div>
      </div>

      {/* ── CORE OPERATIONS SELECTION DECK ── */}
      <div className="adm-content-workspace max-width-wide">
        
        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} ms-spaced-banner`}>
            {systemAlert.text}
          </div>
        )}

        <div className="ms-split-layout-grid-row-2">
            
            {/* ── LEFT HAND SIDE: COMPILING FORM CARD ── */}
            <div className="card ms-compiler-card-panel">
              <div className="ms-card-inner-header-strip">
                <h3 className="ms-card-panel-title">Initialize New Semester</h3>
                <p className="ms-card-panel-subtitle">Define constraint operational bounds for a new academic year.</p>
              </div>

              <form onSubmit={handleSubmit} className="ms-form-stack">
                <div className="ms-form-inline-split-grid-row">
                  <div className="auth-form-group">
                    <label className="adm-input-label">Term Designation</label>
                    <select 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      className="rp-input-field select-cursor-pointer"
                    >
                      <option>Fall</option>
                      <option>Spring</option>
                      <option>Summer</option>
                      <option>Winter</option>
                    </select>
                  </div>
                  <div className="auth-form-group">
                    <label className="adm-input-label">Academic Year</label>
                    <input 
                      placeholder="e.g., 2026" 
                      value={form.academic_year} 
                      onChange={e => setForm({...form, academic_year: e.target.value})} 
                      className="rp-input-field"
                      required 
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="adm-input-label">Syllabus Commencement Start Date</label>
                  <input 
                    type="date" 
                    value={form.start_date} 
                    onChange={e => setForm({...form, start_date: e.target.value})} 
                    className="rp-input-field font-family-inherit-override"
                    required 
                  />
                </div>

                <div className="auth-form-group">
                  <label className="adm-input-label">Term Conclusion End Date</label>
                  <input 
                    type="date" 
                    value={form.end_date} 
                    onChange={e => setForm({...form, end_date: e.target.value})} 
                    className="rp-input-field font-family-inherit-override"
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary ms-btn-submit-form">
                  + Add New Calendar Semester
                </button>
              </form>
            </div>

            {/* ── RIGHT HAND SIDE: EXISTING SEMESTERS LIST DECK ── */}
            <div className="card ms-list-catalog-display-panel">
              <div className="qd-panel-inner-header-banner">
                <h3 className="qd-visual-panel-title remove-margin-bottom">Existing Academic Sessions</h3>
              </div>

              {loading ? (
                <div className="ms-loader-placeholder-text">Syncing active platform calendar rosters...</div>
              ) : semesters.length === 0 ? (
                <div className="sa-empty-workspace-state width-fill-box">
                  <div className="sa-empty-art-logo">🗓️</div>
                  <p className="sa-empty-state-subtitle">No historical academic calendar semesters found in data matrix parameters.</p>
                </div>
              ) : (
                <div className="ms-scrollable-list-viewport-stack">
                  {semesters.map(s => (
                    <div key={s.id} className={`ms-semester-listing-row-node ${s.is_active ? 'ms-listing-state-active' : ''}`}>
                      <div className="ms-listing-text-block">
                        <h4 className="ms-listing-title-heading">
                          {s.name} Session {s.academic_year}
                          {s.is_active && <span className="ms-active-status-badge">ACTIVE BOUND</span>}
                        </h4>
                        <p className="ms-listing-duration-timestamp">
                          📅 Boundaries: {new Date(s.start_date).toLocaleDateString()} — {new Date(s.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleToggle(s.id)} 
                        className={`ms-btn-status-toggle-trigger ${s.is_active ? 'btn-active-toggle' : 'btn-inactive-toggle'}`}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate Space'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

         </div>
      </div>

      <style>{`
        .ms-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        /* ── MISSING HERO BANNER UTILITIES ── */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; z-index: 5; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; margin-bottom: 20px; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; }

        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        
        /* ── FORM & CARD STRUCTURE RECOVERY ── */
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); box-sizing: border-box; }
        .auth-form-group { display: flex; flex-direction: column; gap: 6px; }
        .adm-input-label { font-size: 0.825rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.025em; }
        
        .rp-input-field { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.925rem; outline: none; box-sizing: border-box; color: #0f172a; font-family: inherit; transition: border-color 0.15s; }
        .rp-input-field:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .select-cursor-pointer { cursor: pointer; background-color: #ffffff; }

        .btn-primary { background: #4f46e5; color: #ffffff; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; font-family: inherit; }
        .btn-primary:hover { background: #4338ca; }
        
        /* ── LAYOUT MATRICES ── */
        .ms-split-layout-grid-row-2 { display: grid; grid-template-columns: 1fr 1.3fr; gap: 24px; align-items: start; }
        .ms-compiler-card-panel, .ms-list-catalog-display-panel { display: flex; flex-direction: column; }
        
        .ms-card-inner-header-strip { margin-bottom: 24px; }
        .ms-card-panel-title, .qd-visual-panel-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
        .ms-card-panel-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }
        
        .ms-form-stack { display: flex; flex-direction: column; gap: 16px; }
        .ms-form-inline-split-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .ms-btn-submit-form { width: 100%; margin-top: 8px; font-size: 0.95rem; }
        .font-family-inherit-override { font-family: inherit; }
        
        .ms-scrollable-list-viewport-stack { display: flex; flex-direction: column; gap: 12px; max-height: 520px; overflow-y: auto; padding-right: 4px; }
        .ms-semester-listing-row-node { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; transition: all 0.2s; }
        .ms-semester-listing-row-node:hover { border-color: #cbd5e1; }
        .ms-listing-state-active { border-color: #4f46e5; background: #f5f3ff; }
        .ms-listing-state-active:hover { border-color: #4f46e5; }
        
        .ms-listing-title-heading { margin: 0 0 4px 0; font-size: 1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .ms-active-status-badge { background: #4f46e5; color: #ffffff; font-size: 0.65rem; padding: 2px 8px; border-radius: 50px; text-transform: uppercase; font-weight: 700; }
        .ms-listing-duration-timestamp { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 600; }
        
        .ms-btn-status-toggle-trigger { border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; font-family: inherit; min-width: 120px; text-align: center; }
        .btn-active-toggle { background: #fee2e2; color: #dc2626; }
        .btn-active-toggle:hover { background: #fca5a5; }
        .btn-inactive-toggle { background: #f0fdf4; color: #166534; }
        .btn-inactive-toggle:hover { background: #dcfce7; }
        
        .ms-spaced-banner { margin-bottom: 24px; }
        .ms-loader-placeholder-text { padding: 40px; text-align: center; color: #94a3b8; font-weight: 500; }
        
        /* Empty State */
        .sa-empty-workspace-state { text-align: center; padding: 40px 20px; }
        .sa-empty-art-logo { font-size: 2.5rem; margin-bottom: 12px; }
        .sa-empty-state-subtitle { color: #64748b; font-size: 0.9rem; margin: 0; max-width: 300px; margin: 0 auto; }
        .width-fill-box { width: 100%; border: none; background: transparent; }
        
        /* System Alerts */
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        @media (max-width: 900px) {
            .ms-split-layout-grid-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ManageSemesters;