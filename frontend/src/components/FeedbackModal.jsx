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
    </div>
  );
};

export default FeedbackModal;