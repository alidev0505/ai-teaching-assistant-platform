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