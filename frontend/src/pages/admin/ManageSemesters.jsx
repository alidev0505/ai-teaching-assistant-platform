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
    </div>
  );
};

export default ManageSemesters;