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
    </div>
  );
};

export default ResetPassword;