import React, { useState, useEffect } from 'react';
import { getAnnouncements } from '../services/api';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getAnnouncements();
        if (res?.data?.announcements) {
          // Show only the latest 3 announcements safely
          setAnnouncements(res.data.announcements.slice(0, 3));
        }
      } catch (e) { 
        console.error("Failed to collect backend announcement vectors cleanly:", e); 
      }
    };
    fetchAlerts();
  }, []);

  if (announcements.length === 0) return null;

  const getAlertMetadata = (type) => {
    switch (type) {
      case 'alert':
        return { className: 'ab-type-alert', icon: '🚨' };
      case 'warning':
        return { className: 'ab-type-warning', icon: '⚠️' };
      default:
        return { className: 'ab-type-info', icon: '📢' };
    }
  };

  return (
    <div className="ab-container">
      {announcements.map((ann) => {
        const { className, icon } = getAlertMetadata(ann.type);

        return (
          <div key={ann.id} className={`ab-banner ${className}`}>
            <span className="ab-icon">{icon}</span>
            <span className="ab-content">{ann.content || "System notification notice payload empty."}</span>
          </div>
        );
      })}

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .ab-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-bottom: 24px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          animation: ab-slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ab-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.5;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
          box-sizing: border-box;
          border: 1px solid transparent;
          text-align: left;
        }

        /* Semantic Notification State Custom Matrice Theming */
        .ab-type-alert {
          background-color: #fff5f5;
          color: #c53030;
          border-color: #feb2b2;
        }

        .ab-type-warning {
          background-color: #fffaf0;
          color: #dd6b20;
          border-color: #fbd38d;
        }

        .ab-type-info {
          background-color: #f7fafc;
          color: #2d3748;
          border-color: #e2e8f0;
        }

        .ab-icon {
          font-size: 1.15rem;
          line-height: 1;
          flex-shrink: 0;
          user-select: none;
        }

        .ab-content {
          flex: 1;
          word-break: break-word;
        }

        @keyframes ab-slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Mobile Adaptive Screen Scaling Rules */
        @media (max-width: 640px) {
          .ab-banner {
            padding: 10px 14px;
            font-size: 0.825rem;
            gap: 10px;
          }
          .ab-icon {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;