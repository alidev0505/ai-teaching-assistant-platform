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

  // Close menus on page change
  useEffect(() => {
    setShowNotif(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Handle scroll for transparency
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) setScrolled(true);
      else setScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click-Away logic to close notification box dropdown wrapper gracefully
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      api.get('/notifications/')
        .then(r => setNotifications(r.data.notifications || []))
        .catch(() => { });
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/mark-read/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to update notification state parameter adjustments.");
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';

  const shouldBeSolid = !isTransparent || scrolled || mobileMenuOpen;
  
  const navBg = shouldBeSolid ? '#ffffff' : 'transparent';
  const navText = shouldBeSolid ? '#1e293b' : '#ffffff'; 
  const navBorder = shouldBeSolid ? '#e2e8f0' : 'transparent';

  return (
    <nav style={{
      background: navBg,
      borderBottom: `1px solid ${navBorder}`,
      height: '72px',
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      fontFamily: "'Inter', sans-serif",
      backdropFilter: (shouldBeSolid && !mobileMenuOpen) ? 'blur(12px)' : 'none',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center'
    }}>
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* LOGO */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1100 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🎓</div>
          <span style={{ fontWeight: '800', fontSize: '1.1rem', color: navText, letterSpacing: '-0.3px', transition: 'color 0.3s' }}>AI Teaching Assistant</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {user ? (
            <>
              <Link to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'}
                style={{ color: navText, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', opacity: 0.9 }}>
                Dashboard
              </Link>

              {/* NOTIFICATION LAYER CONTAINER */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: navText, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  🔔 {unreadCount > 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', width: '9px', height: '9px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid white' }} />}
                </button>

                {showNotif && (
                  <div style={{
                    position: 'absolute', top: '40px', right: 0, width: '320px', 
                    background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    maxHeight: '400px', overflowY: 'auto', zIndex: 2000, color: '#1e293b'
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Alert Feed Messages</span>
                      {unreadCount > 0 && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{unreadCount} New</span>}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No recent notifications found.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} 
                             onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                             style={{ 
                               padding: '12px 16px', borderBottom: '1px solid #f8fafc', 
                               cursor: n.is_read ? 'default' : 'pointer',
                               background: n.is_read ? 'transparent' : '#f8fafc',
                               transition: 'background 0.2s', display: 'flex', flexDirection: 'column', gap: '4px'
                             }}>
                          <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: n.is_read ? '400' : '600', lineHeight: '1.4', color: n.is_read ? '#475569' : '#0f172a' }}>{n.message}</p>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{n.created_at}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>{initials}</div>
                <span className="hide-mobile" style={{ color: navText, fontSize: '0.85rem', fontWeight: '700' }}>{user.username}</span>
              </Link>

              <button onClick={logoutUser} style={{ 
                background: shouldBeSolid ? '#f8fafc' : 'rgba(255,255,255,0.1)', 
                border: `1px solid ${shouldBeSolid ? '#e2e8f0' : 'rgba(255,255,255,0.3)'}`, 
                color: navText, padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
              }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: navText, textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>Log In</Link>
              <Link to="/signup" style={{ 
                background: shouldBeSolid ? '#1d4ed8' : '#ffffff', 
                color: shouldBeSolid ? '#ffffff' : '#1d4ed8', 
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700', padding: '10px 24px', borderRadius: '8px', transition: 'all 0.2s'
              }}>Get Started Free</Link>
            </>
          )}
        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', zIndex: 1100, padding: '5px' }}>
           <div style={{ width: '24px', height: '2px', background: navText, marginBottom: '5px', transition: 'all 0.3s ease', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></div>
           <div style={{ width: '24px', height: '2px', background: navText, marginBottom: '5px', transition: 'all 0.3s ease', opacity: mobileMenuOpen ? 0 : 1 }}></div>
           <div style={{ width: '24px', height: '2px', background: navText, transition: 'all 0.3s ease', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></div>
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '100vh', boxSizing: 'border-box', background: '#ffffff',
        display: 'flex', flexDirection: 'column', 
        padding: '100px 30px', gap: '25px', zIndex: 1050,
        transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        boxShadow: mobileMenuOpen ? '-10px 0 30px rgba(0,0,0,0.1)' : 'none'
      }}>
          
        {user ? (
          <>
            <Link to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'} onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', textDecoration: 'none' }}>Profile</Link>
            <button onClick={() => { logoutUser(); setMobileMenuOpen(false); }} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ef4444', textDecoration: 'none', background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', textDecoration: 'none' }}>Home</Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', textDecoration: 'none' }}>Log In</Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1d4ed8', textDecoration: 'none' }}>Get Started Free</Link>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 850px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;