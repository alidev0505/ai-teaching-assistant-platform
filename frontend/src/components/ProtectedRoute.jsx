import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="pr-loading-fullscreen-wrapper">
        <div className="pr-loading-spinner-box">
          <div className="ac-spinner" />
          <p className="pr-loading-text-string">Authenticating User Identity...</p>
        </div>
        
        {/* ── ISOLATED INTERCEPTION LAYOUT MATRIX ── */}
        <style>{`
          .pr-loading-fullscreen-wrapper {
            position: fixed;
            inset: 0;
            background-color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }

          .pr-loading-spinner-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .pr-loading-fullscreen-wrapper .ac-spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #e2e8f0;
            border-top-color: #4f46e5;
            border-radius: 50%;
            animation: pr-guard-spin-loop 0.8s linear infinite;
          }

          .pr-loading-text-string {
            color: #475569;
            font-weight: 600;
            font-size: 0.95rem;
            letter-spacing: -0.01em;
            margin: 0;
          }

          @keyframes pr-guard-spin-loop {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if user attempts to access a role-restricted route
  if (role && user.role !== role) {
    const target = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;