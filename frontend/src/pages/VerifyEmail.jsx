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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .ve-page-wrapper {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .ve-navbar {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0 40px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
        }

        .ve-nav-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .ve-logo-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .ve-brand-text {
          font-weight: 800;
          color: #0f172a;
          font-size: 1.1rem;
          letter-spacing: -0.025em;
        }

        .ve-body-layout {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .ve-content-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          width: 100%;
          max-width: 440px;
          text-align: center;
          box-sizing: border-box;
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ve-status-icon {
          font-size: 3.5rem;
          margin-bottom: 16px;
          line-height: 1;
        }

        .ve-main-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 20px 0;
          letter-spacing: -0.05em;
        }

        .ve-loading-prompt {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
        }

        .ve-error-footer {
          margin-top: 8px;
        }

        .ve-error-disclaimer {
          color: #64748b;
          margin-bottom: 24px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .ve-fallback-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .ve-accent-link {
          color: #4f46e5;
          font-weight: 600;
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.15s;
        }

        .ve-accent-link:hover {
          color: #4338ca;
          text-decoration: underline;
        }

        .ve-divider-dot {
          color: #94a3b8;
          font-weight: 800;
          user-select: none;
        }

        /* Standardized Action Button Framework Mapping */
        .btn-primary.auth-submit-btn {
          width: 100%;
          padding: 0.85rem 1.5rem;
          background-color: #4f46e5;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 0.95rem;
          transition: background-color 0.2s, transform 0.1s;
        }

        .btn-primary.auth-submit-btn:hover {
          background-color: #4338ca;
        }

        .btn-primary.auth-submit-btn:active {
          transform: scale(0.99);
        }

        .text-center-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        /* Notification Layout Mappings */
        .auth-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
          line-height: 1.4;
          box-sizing: border-box;
          text-align: center;
        }

        .auth-alert.error {
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }

        .auth-alert.success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .ve-navbar {
            padding: 0 20px;
          }
          .ve-content-card {
            padding: 32px 20px;
          }
          .ve-main-title {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;