import React, { useState, useEffect } from 'react';
import { getAllFeedback } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await getAllFeedback();
        setReviews(res?.data?.reviews || []);
      } catch (err) { 
        console.error("Failed to load student course feedback telemetry logs:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchFeedback();
  }, []);

  return (
    <div className="af-page-wrapper">
      <div className="af-content-container">
        
        {/* ── HEADER NAVIGATION CONSOLE ── */}
        <div className="af-header-row">
          <div className="af-header-title-block">
            <h1 className="af-main-heading-title">📢 Student Course Feedback</h1>
            <p className="af-main-subtitle-text">Monitoring automated course quality metrics, lecture satisfaction, and evaluations.</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn-secondary af-btn-back-dashboard">
            Back to Dashboard
          </button>
        </div>

        {/* ── DYNAMIC FEED STACK WORKSPACE ── */}
        {loading ? (
          <div className="sa-empty-workspace-state">
            <p className="sa-empty-state-subtitle">Syncing client review datasets...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="sa-empty-workspace-state">
            <div className="sa-empty-art-logo">📭</div>
            <h3 className="sa-empty-state-title">No Reviews Submitted</h3>
            <p className="sa-empty-state-subtitle">Course quality feedback sheets will appear here once student submissions are saved.</p>
          </div>
        ) : (
          <div className="af-reviews-cards-stack">
            {reviews.map(r => {
              const reviewRating = Number(r?.rating) || 0;
              const complianceClass = reviewRating < 3 ? 'review-state-critical' : 'review-state-healthy';
              
              return (
                <div key={r.id} className={`card af-review-card ${complianceClass}`}>
                  <div className="af-card-split-header-row">
                    <div className="af-course-details-wrapper">
                      <h3 className="af-course-title-text">{r.course}</h3>
                      <div className="af-instructor-meta-text">
                        Instructor Guide: <strong className="af-instructor-name-string">{r.teacher}</strong>
                      </div>
                    </div>
                    
                    <div className="af-rating-timestamp-block">
                      {/* ✅ REFACTOR: Safe rendering loops prevent string parsing spills */}
                      <div className="af-stars-numerical-row" aria-label={`Rating: ${reviewRating} out of 5 stars`}>
                        <span className="af-stars-filled">{"★".repeat(Math.min(Math.max(reviewRating, 0), 5))}</span>
                        <span className="af-stars-empty">{"★".repeat(Math.min(Math.max(5 - reviewRating, 0), 5))}</span>
                      </div>
                      <div className="af-timestamp-log-date">Submitted: {r.date}</div>
                    </div>
                  </div>
                  
                  {r.comment?.trim() && (
                    <div className="af-student-comment-panel-box">
                      <span className="af-quote-marker-prefix">"</span>
                      <span className="af-comment-body-text">{r.comment}</span>
                      <span className="af-quote-marker-suffix">"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;