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
             <div className="adc-spinner" />
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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .af-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding: 40px 24px; box-sizing: border-box; }
        .af-content-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
        
        /* Layout Header Navigation Frame */
        .af-header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; }
        .af-header-title-block { display: flex; flex-direction: column; gap: 6px; }
        .af-main-heading-title { margin: 0; font-size: 1.8rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
        .af-main-subtitle-text { margin: 0; font-size: 0.95rem; color: #64748b; font-weight: 500; }
        
        .btn-secondary { background-color: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 10px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .btn-secondary:hover { background-color: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
        .af-btn-back-dashboard { white-space: nowrap; }

        /* Shared Empty State Sub-System */
        .sa-empty-workspace-state { padding: 80px 24px; text-align: center; border: 2px dashed #cbd5e1; border-radius: 16px; background: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .sa-empty-art-logo { font-size: 3.5rem; margin-bottom: 16px; opacity: 0.5; line-height: 1; }
        .sa-empty-state-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
        .sa-empty-state-subtitle { color: #64748b; font-size: 0.95rem; margin: 0; font-weight: 500; max-width: 400px; line-height: 1.5; }
        
        .adc-spinner { width: 40px; height: 40px; border: 4px solid #cbd5e1; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Student Reviews Grid Card System */
        .af-reviews-cards-stack { display: flex; flex-direction: column; gap: 20px; }
        .card { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        
        .af-review-card { border: 1px solid #e2e8f0; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s, box-shadow 0.2s; }
        .af-review-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        
        /* Dynamic Theming Context Indicator Statuses */
        .review-state-critical { border-left: 5px solid #ef4444; }
        .review-state-healthy { border-left: 5px solid #10b981; }

        .af-card-split-header-row { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; }
        .af-course-details-wrapper { display: flex; flex-direction: column; gap: 4px; }
        .af-course-title-text { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        
        .af-instructor-meta-text { font-size: 0.85rem; color: #64748b; }
        .af-instructor-name-string { color: #334155; font-weight: 700; }

        .af-rating-timestamp-block { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .af-stars-numerical-row { font-size: 1.15rem; line-height: 1; letter-spacing: 2px; }
        .af-stars-filled { color: #eab308; }
        .af-stars-empty { color: #e2e8f0; }
        .af-timestamp-log-date { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

        /* Comment Quotation Array Blocks */
        .af-student-comment-panel-box { background-color: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #f1f5f9; position: relative; margin-top: 4px; }
        .af-comment-body-text { font-size: 0.9rem; color: #475569; line-height: 1.6; font-style: italic; }
        .af-quote-marker-prefix, .af-quote-marker-suffix { font-family: Georgia, serif; font-size: 1.5rem; color: #cbd5e1; font-weight: 800; line-height: 0; position: relative; top: 8px; }
        .af-quote-marker-prefix { margin-right: 4px; }
        .af-quote-marker-suffix { margin-left: 4px; }

        /* Mobile Adjustments Views Port Shifters */
        @media (max-width: 640px) {
          .af-page-wrapper { padding: 24px 16px; }
          .af-card-split-header-row { flex-direction: column; align-items: flex-start; gap: 12px; }
          .af-rating-timestamp-block { align-items: flex-start; }
          .af-header-row { padding-bottom: 20px; }
          .af-main-heading-title { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default AdminFeedback;