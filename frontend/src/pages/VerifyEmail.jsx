import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error | already_verified
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          if (data.message && data.message.toLowerCase().includes('already')) {
            setStatus('already_verified');
          } else {
            setStatus('success');
          }
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch {
        if (isMounted) {
          setStatus('error');
          setMessage('Could not establish connection to authentication server.');
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const icons = {
    loading: '⏳',
    success: '✅',
    already_verified: '✔️',
    error: '❌',
  };

  return (
    <div className="ve-page-wrapper">
      
      {/* Structural Brand Navigation Header */}
      <nav className="ve-navbar">
        <Link to="/" className="ve-nav-brand-link">
          <div className="ve-logo-badge">🎓</div>
          <span className="ve-brand-text">AI Teaching Assistant</span>
        </Link>
      </nav>

      {/* Main Response Verification Container Core */}
      <div className="ve-body-layout">
        <div className="ve-content-card">
          <div className="ve-status-icon">{icons[status]}</div>

          <h1 className="ve-main-title">
            {status === 'loading' && 'Verifying your email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'already_verified' && 'Already Verified'}
            {status === 'error' && 'Verification Failed'}
          </h1>

          {/* ✅ REFACTOR: Interfaced with your master alert structure design system */}
          {status !== 'loading' && (
            <div className={`auth-alert ${status === 'error' ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {status === 'loading' && (
            <p className="ve-loading-prompt">Please wait a moment while we process your request...</p>
          )}

          {(status === 'success' || status === 'already_verified') && (
            <Link to="/login" className="btn-primary auth-submit-btn text-center-link">
              Go to Login
            </Link>
          )}

          {status === 'error' && (
            <div className="ve-error-footer">
              <p className="ve-error-disclaimer">
                The verification token path signature might be unverified, altered, or expired.
              </p>
              <div className="ve-fallback-row">
                <Link to="/signup" className="ve-accent-link">Sign up again</Link>
                <span className="ve-divider-dot">·</span>
                <Link to="/login" className="ve-accent-link">Log in</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;