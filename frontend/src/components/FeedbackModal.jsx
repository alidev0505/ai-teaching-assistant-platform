import React, { useState } from 'react';
import { submitFeedback } from '../services/api';

const FeedbackModal = ({ courseId, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await submitFeedback(courseId, { rating, comment: comment.trim() });
      setSuccessMsg('✨ Thank you for your valuable feedback!');
      
      // Allow the success message to be viewed before closing the modal context
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to submit feedback entries safely.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = () => {
    if (rating === 5) return "Excellent! 🤩";
    if (rating === 4) return "Good 🙂";
    if (rating === 3) return "Average 😐";
    if (rating === 2) return "Poor 😞";
    return "Terrible 😡";
  };

  return (
    <div className="fm-overlay">
      <div className="fm-modal-card">
        <h2 className="fm-modal-title">Rate this Course</h2>
        
        <form onSubmit={handleSubmit}>
          {/* STAR RATING COMPONENT */}
          <div className="fm-stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                onClick={() => setRating(star)} 
                className={`fm-star-icon ${star <= rating ? 'active' : 'inactive'}`}
              >
                ★
              </span>
            ))}
          </div>
          
          <p className="fm-rating-badge">
            {getRatingLabel()}
          </p>

          <div className="fm-form-group">
            <label className="fm-form-label">Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this course context?"
              rows="4"
              maxLength="500"
              className="fm-textarea"
            />
          </div>

          {/* DYNAMIC FEEDBACK NOTIFICATION BANNERS */}
          {error && <div className="fm-banner-error">⚠️ {error}</div>}
          {successMsg && <div className="fm-banner-success">{successMsg}</div>}

          <div className="fm-action-row">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              className="fm-btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="fm-btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>

      {/* ── COMPONENT SELF-CONTAINED DESIGN STYLES ── */}
      <style>{`
        .fm-overlay {
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

        .fm-modal-card {
          background-color: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
          padding: 32px;
          box-sizing: border-box;
          animation: fm-scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fm-modal-title {
          margin: 0 0 24px 0;
          color: #0f172a;
          text-align: center;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.025em;
        }

        /* Interactive Feedback Stars Track */
        .fm-stars-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .fm-star-icon {
          font-size: 2.5rem;
          cursor: pointer;
          user-select: none;
          line-height: 1;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .fm-star-icon:hover {
          transform: scale(1.1);
        }

        .fm-star-icon.active {
          color: #eab308;
          text-shadow: 0 2px 4px rgba(234, 179, 8, 0.15);
        }

        .fm-star-icon.inactive {
          color: #cbd5e1;
        }

        .fm-rating-badge {
          text-align: center;
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
          margin: 0 0 24px 0;
        }

        /* Comments Form Elements Controls */
        .fm-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 24px;
        }

        .fm-form-label {
          font-weight: 700;
          color: #334155;
          font-size: 0.825rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .fm-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #0f172a;
          background-color: #ffffff;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          resize: none;
          line-height: 1.5;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .fm-textarea:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Context System Banner Responses */
        .fm-banner-error, .fm-banner-success {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        .fm-banner-error {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          text-align: left;
        }

        .fm-banner-success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
          text-align: center;
        }

        /* Action Layout Configurations */
        .fm-action-row {
          display: flex;
          gap: 12px;
        }

        .fm-btn-secondary, .fm-btn-primary {
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

        .fm-btn-secondary {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
        }

        .fm-btn-secondary:hover:not(:disabled) {
          background-color: #f8fafc;
          color: #0f172a;
        }

        .fm-btn-primary {
          background-color: #4f46e5;
          border: none;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
        }

        .fm-btn-primary:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .fm-btn-secondary:disabled, .fm-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes fm-scale-up {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 440px) {
          .fm-modal-card { padding: 24px 20px; }
          .fm-action-row { flex-direction: column-reverse; gap: 10px; }
          .fm-action-row button { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default FeedbackModal;