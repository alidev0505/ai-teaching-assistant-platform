import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Navbar = ({ isTransparent = false }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const notifRef = useRef(null);

  useEffect(() => {
    setShowNotif(false);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications/')
        .then(r => setNotifications(r?.data?.notifications || []))
        .catch(() => {});
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/mark-read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed notification update handshake:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const shouldBeSolid = !isTransparent || scrolled || mobileMenuOpen;

  return (
    <nav className={`nav-wrapper ${shouldBeSolid ? 'nav-solid' : 'nav-transparent'}`}>
      <div className="nav-container">
        
        {/* LOGO SYSTEM */}
        <Link to="/" className="nav-logo-link">
          <div className="nav-logo-badge">🎓</div>
          <span className="nav-logo-text">AI Teaching Assistant</span>
        </Link>

        {/* DESKTOP NAV DECK */}
        <div className="desktop-nav-menu">
          {user ? (
            <>
              <Link to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'} className="nav-link">
                Dashboard
              </Link>

              <div className="notif-layer-container" ref={notifRef}>
                <button onClick={() => setShowNotif(!showNotif)} className="nav-notif-btn">
                  🔔 {unreadCount > 0 && <span className="nav-notif-badge" />}
                </button>

                {showNotif && (
                  <div className="notif-dropdown-pane">
                    <div className="notif-pane-header">
                      <span>Alert Feed Messages</span>
                      {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} New</span>}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="notif-empty-state">No recent notifications found.</div>
                    ) : (
                      <div className="notif-scroll-area">
                        {notifications.map(n => (
                          <div key={n.id} onClick={() => !n.is_read && handleMarkAsRead(n.id)} className={`notif-item ${n.is_read ? 'is-read' : 'is-unread'}`}>
                            <p className="notif-msg-text">{n.message}</p>
                            <span className="notif-time-stamp">{n.created_at}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link to="/profile" className="nav-profile-link">
                <div className="nav-profile-avatar">{initials}</div>
                <span className="nav-profile-name">{user.username}</span>
              </Link>

              <button onClick={logoutUser} className="nav-logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/signup" className="nav-cta-btn">Get Started Free</Link>
            </>
          )}
        </div>

        {/* MOBILE OVERLAY TOGGLE */}
        <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Navigation">
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* MOBILE MENU OVERLAY PANEL */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'is-open' : ''}`}>
        {user ? (
          <>
            <Link to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            <button onClick={() => { logoutUser(); setMobileMenuOpen(false); }} className="mobile-logout-btn-overlay">Logout</button>
          </>
        ) : (
          <>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link to="/signup" className="mobile-cta-btn" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
          </>
        )}
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          display: flex;
          align-items: center;
          z-index: 2000;
          transition: background-color 0.25s, border-color 0.25s, box-shadow 0.25s;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
        }

        .nav-transparent {
          background-color: transparent;
          border-bottom: 1px solid transparent;
        }

        .nav-solid {
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.05);
        }

        .nav-container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-sizing: border-box;
        }

        .nav-logo-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          z-index: 2100;
        }

        .nav-logo-badge {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .nav-logo-text {
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.025em;
          color: #0f172a;
          transition: color 0.25s;
        }

        .nav-transparent .nav-logo-text {
          color: #ffffff;
        }

        .nav-solid .nav-logo-text {
          color: #0f172a;
        }

        /* Desktop Items Menu */
        .desktop-nav-menu {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          text-decoration: none;
          font-size: 0.925rem;
          font-weight: 600;
          transition: color 0.2s;
        }

        .nav-transparent .nav-link { color: rgba(255, 255, 255, 0.9); }
        .nav-transparent .nav-link:hover { color: #ffffff; }
        .nav-solid .nav-link { color: #475569; }
        .nav-solid .nav-link:hover { color: #4f46e5; }

        .nav-cta-btn {
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 700;
          padding: 9px 18px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-transparent .nav-cta-btn { background: #ffffff; color: #4f46e5; }
        .nav-solid .nav-cta-btn { background: #4f46e5; color: #ffffff; }
        .nav-solid .nav-cta-btn:hover { background: #4338ca; }

        /* Notification Dropdown Layer System */
        .notif-layer-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .nav-notif-btn {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;
          position: relative;
          outline: none;
          display: flex;
          align-items: center;
        }

        .nav-notif-badge {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }

        .notif-dropdown-pane {
          position: absolute;
          top: calc(100% + 14px);
          right: -10px;
          width: 320px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
          overflow: hidden;
          animation: navPaneIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .notif-pane-header {
          padding: 14px 16px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: #1e293b;
        }

        .notif-count-pill {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 2px 8px;
          border-radius: 50px;
          font-size: 0.75rem;
        }

        .notif-scroll-area {
          max-height: 280px;
          overflow-y: auto;
        }

        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background-color: #f8fafc; }
        .notif-item.is-unread { background-color: #f0fdf4; }
        .notif-item.is-unread:hover { background-color: #e6fbf0; }

        .notif-msg-text {
          margin: 0 0 4px 0;
          font-size: 0.85rem;
          color: #334155;
          line-height: 1.4;
          text-align: left;
        }

        .notif-time-stamp {
          font-size: 0.725rem;
          color: #94a3b8;
          font-weight: 500;
          display: block;
          text-align: left;
        }

        .notif-empty-state {
          padding: 32px 16px;
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
        }

        /* Profile link anchor bindings */
        .nav-profile-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          min-width: 0;
        }

        .nav-profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e0e7ff;
          color: #4f46e5;
          font-weight: 700;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid #c7d2fe;
        }

        .nav-profile-name {
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          transition: color 0.2s;
        }

        .nav-transparent .nav-profile-name { color: #ffffff; }
        .nav-solid .nav-profile-name { color: #334155; }

        .nav-logout-btn {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }

        .nav-solid .nav-logout-btn:hover { background-color: #f1f5f9; color: #0f172a; border-color: #94a3b8; }
        .nav-transparent .nav-logout-btn { border-color: rgba(255,255,255,0.3); color: #ffffff; }
        .nav-transparent .nav-logout-btn:hover { background-color: rgba(255,255,255,0.1); }

        /* Hamburger Control Elements Layout Toggle */
        .mobile-toggle-btn {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          z-index: 2200;
          outline: none;
        }

        .hamburger-bar {
          width: 22px;
          height: 2px;
          border-radius: 2px;
          transition: transform 0.25s, opacity 0.25s, background-color 0.25s;
        }

        .nav-transparent .hamburger-bar { background-color: #ffffff; }
        .nav-solid .hamburger-bar { background-color: #0f172a; }

        .hamburger-bar.open:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); background-color: #0f172a !important; }
        .hamburger-bar.open:nth-child(2) { opacity: 0; }
        .hamburger-bar.open:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); background-color: #0f172a !important; }

        /* Mobile Responsive overlay drawer module sheet rules */
        .mobile-nav-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background-color: #ffffff;
          z-index: 1900;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 40px;
          box-sizing: border-box;
          transform: translateY(-100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mobile-nav-overlay.is-open {
          transform: translateY(0);
        }

        .mobile-nav-overlay a {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          text-decoration: none;
        }

        .mobile-cta-btn {
          background-color: #4f46e5;
          color: #ffffff !important;
          padding: 12px 32px;
          border-radius: 8px;
        }

        .mobile-logout-btn-overlay {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.1rem;
          width: 100%;
          max-width: 200px;
          cursor: pointer;
        }

        @keyframes navPaneIn {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 840px) {
          .desktop-nav-menu { display: none !important; }
          .mobile-toggle-btn { display: flex; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;