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

  // ✅ REFACTOR: Maps clean semantic class targets instead of raw programmatically injected hex values
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
    </div>
  );
};

export default AdminAnnouncements;