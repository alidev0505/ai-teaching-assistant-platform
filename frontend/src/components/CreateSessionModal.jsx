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

    // 🔥 VALIDATION CHECK: Block past date configurations
    const selectedDate = new Date(formData.start_time);
    const currentDate = new Date();
    if (selectedDate < currentDate) {
      setError('Validation Error: Class start schedule must reside in a future timeframe.');
      return;
    }

    setLoading(true);
    try {
      // ✅ LOGIC IMPROVEMENT: Handle fallback to Jitsi room if meeting link input field is left empty
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

          {/* SYSTEM BANNERS */}
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
    </div>
  );
};

export default CreateSessionModal;