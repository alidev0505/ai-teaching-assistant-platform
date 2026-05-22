import React, { useEffect, useState } from 'react';
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
    </div>
  );
};

export default AnnouncementBanner;