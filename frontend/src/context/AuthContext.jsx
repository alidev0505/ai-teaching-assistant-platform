import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login status on application mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Attempt to fetch user details using the stored token validation route
        const res = await api.get('/auth/me');
        
        // Handle potential response structure variations flexibly
        const userData = res?.data?.user || res?.data;
        if (userData) {
          setUser(userData);
        } else {
          throw new Error("Invalid user authentication object signature returned.");
        }
        
      } catch (err) {
        console.warn("Session expired or invalid token structure. Purging local store.");
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const loginUser = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    
    if (res?.data?.access_token) {
        localStorage.setItem('token', res.data.access_token);
        
        // Dynamic fallback fallback if user object isn't fully nested inside response
        const userData = res.data.user || { email, role: res.data.role || 'student' };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }
    throw new Error("Authentication failed: Missing access token token vector mapping.");
  };

  const signupUser = async (userData) => {
    return await api.post('/auth/signup', userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login'; // Hard reset to purge un-garbage-collected states cleanly
  };

  // ✅ UI OPTIMIZATION: Swapped hardcoded loading framework wrapper for clean CSS layout hooking
  if (loading) {
    return (
      <div className="ac-loading-overlay">
        <div className="ac-loading-spinner-box">
          <div className="ac-spinner"></div>
          <span className="ac-loading-text">Verifying User Session...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, signupUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};