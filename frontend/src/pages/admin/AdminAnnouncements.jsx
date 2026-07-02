import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, postAnnouncement, deleteAnnouncement } from '../../services/api';

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ content: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      const res = await getAnnouncements();
      setList(res?.data?.announcements || []);
    } catch (err) {
      console.error("Failed to fetch administrative announcements roster.", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await postAnnouncement({ content: form.content.trim(), type: form.type });
      setForm({ content: '', type: 'info' });
      await loadData();
    } catch (err) {
      setError('Broadcast Failure: Unable to post announcement message.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to de-index and delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      await loadData();
    } catch (err) {
      setError('Operation Failure: Failed to remove targeted announcement.');
    }
  };

  const getBannerMeta = (type) => {
    switch(type) {
      case 'warning': return { className: 'ab-type-warning', icon: '⚠️' };
      case 'alert': return { className: 'ab-type-alert', icon: '🚨' };
      default: return { className: 'ab-type-info', icon: '📢' };
    }
  };

  return (
    <div className="adm-page-wrapper">
      
      {/* ── HERO BANNER CONTROL CONSOLE ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container">
          <button onClick={() => navigate(-1)} className="adm-btn-back">
            ← Back to Dashboard
          </button>
          <h1 className="adm-hero-main-title">Global Announcements</h1>
          <p className="adm-hero-subtitle">Broadcast critical platform alerts and messages across all active user streams.</p>
        </div>
      </div>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="adm-content-workspace">
        
        {error && <div className="auth-alert error adm-spaced-banner">⚠️ {error}</div>}

        {/* COMPILING FORM CARD */}
        <div className="card adm-form-card">
          <h3 className="adm-panel-title">Post New Message</h3>
          <form onSubmit={handleSubmit} className="adm-form-container">
            <div className="auth-form-group">
              <label className="adm-input-label">Message Content</label>
              <textarea 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
                required
                placeholder="e.g., Scheduled server maintenance windows initialized for Friday midnight..."
                className="rp-input-field adm-textarea-resize-lock"
              />
            </div>
            
            <div className="auth-form-group">
              <label className="adm-input-label">Broadcast Priority Type</label>
              <select 
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="rp-input-field select-cursor-pointer"
              >
                <option value="info">ℹ️ System Info Notification (Blue)</option>
                <option value="warning">⚠️ High Priority Warning (Yellow)</option>
                <option value="alert">🚨 Urgent Structural Alert (Red)</option>
              </select>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary auth-submit-btn">
              {loading ? 'Transmitting Broadcast...' : 'Post Global Announcement'}
            </button>
          </form>
        </div>

        {/* RENDER BROADCAST LIST METRICS */}
        <div className="adm-announcements-list-stack">
          {list.map(item => {
            const meta = getBannerMeta(item.type);
            return (
              <div key={item.id} className={`ab-banner ${meta.className} adm-broadcast-item-card`}>
                <div className="adm-broadcast-left-content">
                  <div className="adm-broadcast-icon-wrapper">{meta.icon}</div>
                  <div className="adm-broadcast-text-block">
                    <div className="adm-broadcast-body-string">{item.content}</div>
                    <div className="adm-broadcast-timestamp-log">Broadcast initialized: {item.date}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="adm-btn-delete-broadcast"
                  aria-label="Delete targeted announcement"
                >
                  Delete
                </button>
              </div>
            );
          })}
          
          {list.length === 0 && (
            <div className="pr-empty-roster-state-box">
              <div className="pr-empty-box-art">📭</div>
              <p className="pr-empty-box-message-prompt">No active global notifications currently broadcasted onto server hubs.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .adm-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', system-ui, sans-serif; }
        
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .adm-hero-container { max-width: 900px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; transition: background 0.2s; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; }
        
        .adm-content-workspace { max-width: 900px; margin: -50px auto 0; padding: 0 24px; position: relative; }
        
        .adm-form-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); margin-bottom: 30px; }
        .adm-panel-title { margin: 0 0 20px 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        .adm-form-container { display: flex; flex-direction: column; gap: 16px; }
        .adm-input-label { font-weight: 700; color: #475569; font-size: 0.825rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .adm-textarea-resize-lock { resize: vertical; min-height: 120px; }
        
        .adm-announcements-list-stack { display: flex; flex-direction: column; gap: 16px; }
        .adm-broadcast-item-card { display: flex; align-items: flex-start; justify-content: space-between; border-radius: 12px; padding: 20px; }
        .adm-broadcast-left-content { display: flex; gap: 16px; align-items: flex-start; }
        .adm-broadcast-icon-wrapper { font-size: 1.5rem; line-height: 1; }
        .adm-broadcast-body-string { font-size: 0.95rem; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
        .adm-broadcast-timestamp-log { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        
        .adm-btn-delete-broadcast { background: transparent; border: 1px solid rgba(0,0,0,0.1); padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer; color: #dc2626; transition: all 0.15s; }
        .adm-btn-delete-broadcast:hover { background: #fee2e2; border-color: #fca5a5; }
        
        /* Fallback State */
        .pr-empty-roster-state-box { text-align: center; padding: 60px 24px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 12px; color: #64748b; }
        .pr-empty-box-art { font-size: 3rem; margin-bottom: 12px; }
        .pr-empty-box-message-prompt { font-weight: 600; }

        /* Shared Component Styles */
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .adm-spaced-banner { margin-bottom: 20px; }
        .btn-primary { background: #2563eb; color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; }
        .rp-input-field { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default AdminAnnouncements;