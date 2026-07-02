import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Password reset successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Could not connect to the server. Please try again later.');
    }
  };

  return (
    <div className="rp-page-wrapper">

      {/* Structural Top Subsystem Header */}
      <nav className="rp-navbar">
        <Link to="/" className="rp-brand-link">
          <div className="rp-logo-badge">🎓</div>
          <span className="rp-brand-text">AI Teaching Assistant</span>
        </Link>
        <Link to="/login" className="rp-login-back-link">
          Back to Login →
        </Link>
      </nav>

      <div className="rp-body-layout">
        <div className="rp-stack-container">

          {/* Context Explainer Header */}
          <div className="rp-form-header">
            <div className="rp-lock-icon">🔒</div>
            <h1 className="rp-main-title">Set New Password</h1>
            <p className="rp-subtitle">
              Choose a strong new password for your account profile securely.
            </p>
          </div>

          <div className="auth-card">

            {/* Success Core View Matrix */}
            {status === 'success' ? (
              <div className="rp-success-console">
                <div className="rp-success-art">✅</div>
                <div className="auth-alert success">
                  {message}
                </div>
                <p className="rp-redirect-prompt">
                  Redirecting you back to the authentication terminal window...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                
                {/* Standardized Warning Stack Field */}
                {status === 'error' && (
                  <div className="auth-alert error">
                    ⚠️ {message}
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="rp-input-label">New Password</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="rp-input-field"
                  />
                </div>

                <div className="auth-form-group">
                  <label className="rp-input-label">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="rp-input-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary auth-submit-btn"
                >
                  {status === 'loading' ? 'Resetting Account...' : 'Reset Password'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .rp-page-wrapper {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .rp-navbar {
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

        .rp-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .rp-logo-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .rp-brand-text {
          font-weight: 800;
          color: #0f172a;
          font-size: 1.1rem;
          letter-spacing: -0.025em;
        }

        .rp-login-back-link {
          color: #4f46e5;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .rp-login-back-link:hover {
          color: #4338ca;
          text-decoration: underline;
        }

        .rp-body-layout {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .rp-stack-container {
          width: 100%;
          max-width: 440px;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .rp-form-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .rp-lock-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          line-height: 1;
        }

        .rp-main-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.05em;
        }

        .rp-subtitle {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .auth-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 32px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          box-sizing: border-box;
        }

        .auth-form-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rp-input-label {
          display: block;
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
        }

        .rp-input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          color: #0f172a;
          background-color: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .rp-input-field:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem 1.5rem;
          background-color: #4f46e5;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-size: 0.95rem;
          margin-top: 8px;
          transition: background-color 0.2s, transform 0.1s;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .auth-submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status Panels Handlers */
        .auth-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 20px;
          line-height: 1.4;
          box-sizing: border-box;
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

        .rp-success-console {
          text-align: center;
          animation: scaleUp 0.2s ease-out;
        }

        .rp-success-art {
          font-size: 3.5rem;
          margin-bottom: 16px;
          line-height: 1;
        }

        .rp-redirect-prompt {
          color: #64748b;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-top: 16px;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 24px 20px;
          }
          .rp-form-header h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;