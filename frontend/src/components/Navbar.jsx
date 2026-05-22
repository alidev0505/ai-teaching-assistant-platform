import React, { useContext, useState, useEffect, useRef } from 'react';
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
                      notifications.map(n => (
                        <div key={n.id} onClick={() => !n.is_read && handleMarkAsRead(n.id)} className={`notif-item ${n.is_read ? 'is-read' : 'is-unread'}`}>
                          <p className="notif-msg-text">{n.message}</p>
                          <span className="notif-time-stamp">{n.created_at}</span>
                        </div>
                      ))
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
        <button className="mobile-toggle-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
           <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* MOBILE MENU OVERLAY PANEL */}
      <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'is-open' : ''}`}>
        {user ? (
          <>
            <Link to={user.role === 'teacher' ? '/teacher' : '/admin'} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            <button onClick={() => { logoutUser(); setMobileMenuOpen(false); }} className="mobile-logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;