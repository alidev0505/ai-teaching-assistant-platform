import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        fontFamily: "'Segoe UI', Roboto, sans-serif"
      }}>
        <div className="ai-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid #38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '15px'
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
};

export default ProtectedRoute;