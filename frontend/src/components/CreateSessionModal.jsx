import React, { useState } from 'react';
import { createLiveSession } from '../services/api';

const CreateSessionModal = ({ courseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', meeting_link: '', start_time: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const selectedDate = new Date(formData.start_time);
    const currentDate = new Date();
    if (selectedDate < currentDate) {
      setError('Validation Error: Class start schedule must reside in a future timeframe.');
      return;
    }

    setLoading(true);
    try {
      let finalizedLink = formData.meeting_link.trim();
      if (!finalizedLink) {
        const uniqueRoomToken = `SmartTutor-Session-${courseId}-${Math.random().toString(36).substring(2, 9)}`;
        finalizedLink = `https://meet.jit.si/${uniqueRoomToken}`;
      }

      await createLiveSession({ 
        ...formData, 
        meeting_link: finalizedLink,
        course_id: courseId 
      });

      setSuccessMsg('✨ Live class channel scheduled perfectly!');
      
      setTimeout(() => {
        onSuccess(); 
        onClose(); 
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to establish a live classroom configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sm-overlay">
      <div className="sm-modal-card">
        <h2 className="sm-modal-title">📅 Schedule Live Class</h2>
        
        <form onSubmit={handleSubmit} className="sm-form-container">
          <div className="sm-form-group">
            <label className="sm-form-label">Topic / Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Week 4: Deep Learning Foundations"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="sm-input"
            />
          </div>

          <div className="sm-form-group">
            <label className="sm-form-label">Meeting Link (Zoom/Meet)</label>
            <input 
              type="url" 
              placeholder="Leave empty to auto-generate a secure Jitsi room"
              value={formData.meeting_link}
              onChange={e => setFormData({...formData, meeting_link: e.target.value})}
              className="sm-input"
            />
          </div>

          <div className="sm-form-group">
            <label className="sm-form-label">Date & Time</label>
            <input 
              required
              type="datetime-local" 
              value={formData.start_time}
              onChange={e => setFormData({...formData, start_time: e.target.value})}
              className="sm-input"
            />
          </div>

          <div className="sm-form-group">
             <label className="sm-form-label">Description (Optional)</label>
             <textarea 
               rows="3"
               placeholder="Provide session notes or reading prerequisites..."
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
               className="sm-textarea"
             />
          </div>

          {error && <div className="sm-banner-error">⚠️ {error}</div>}
          {successMsg && <div className="sm-banner-success">{successMsg}</div>}

          <div className="sm-action-row">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              className="sm-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="sm-btn-primary"
            >
              {loading ? 'Scheduling...' : 'Confirm Class'}
            </button>
          </div>
        </form>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .sm-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 20px;
          box-sizing: border-box;
        }

        .sm-modal-card {
          background-color: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          padding: 32px;
          box-sizing: border-box;
          animation: sm-scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sm-modal-title {
          margin: 0 0 24px 0;
          color: #0f172a;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .sm-form-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sm-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sm-form-label {
          font-weight: 700;
          color: #334155;
          font-size: 0.825rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sm-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #0f172a;
          background-color: #ffffff;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
          height: 42px;
        }

        .sm-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .sm-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: inherit;
          color: #0f172a;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .sm-textarea:focus { border-color: #4f46e5; }

        .sm-banner-error, .sm-banner-success {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.4;
          box-sizing: border-box;
        }

        .sm-banner-error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .sm-banner-success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        .sm-action-row {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .sm-btn-secondary, .sm-btn-primary {
          flex: 1;
          padding: 11px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          box-sizing: border-box;
          text-align: center;
        }

        .sm-btn-secondary {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .sm-btn-secondary:hover:not(:disabled) {
          background-color: #f8fafc;
          color: #0f172a;
        }

        .sm-btn-primary {
          background-color: #4f46e5;
          border: none;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
        }

        .sm-btn-primary:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .sm-btn-secondary:disabled, .sm-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes sm-scale-up {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .sm-modal-card { padding: 24px 20px; }
          .sm-action-row { flex-direction: column-reverse; gap: 10px; }
          .sm-action-row button { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CreateSessionModal;