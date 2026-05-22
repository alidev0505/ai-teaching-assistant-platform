import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // ── Structural Input Validations ──
    if (!email.trim()) {
      setStatus('error');
      setMessage('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatus('error');
      setMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Check your inbox for a password reset link.');
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
    <div className="fp-page-wrapper">

      {/* Top Application Sub-Navigation */}
      <nav className="fp-navbar">
        <Link to="/" className="fp-brand-link">
          <div className="fp-logo-badge">🎓</div>
          <span className="fp-brand-text">AI Teaching Assistant</span>
        </Link>
        <Link to="/login" className="fp-login-back-link">
          Back to Login →
        </Link>
      </nav>

      <div className="fp-body-layout">
        <div className="fp-stack-container">

          {/* Core Descriptive Context Section */}
          <div className="fp-form-header">
            <div className="fp-key-icon">🔑</div>
            <h1 className="fp-main-title">ForgotPassword?</h1>
            <p className="fp-subtitle">
              Enter your email and we'll transmit an account profile reset path token.
            </p>
          </div>

          <div className="auth-card">

            {/* Success Core View Layout Container */}
            {status === 'success' ? (
              <div className="fp-success-console">
                <div className="fp-success-art">📬</div>
                <div className="auth-alert success">
                  {message}
                </div>
                <p className="fp-retry-disclaimer">
                  Didn't receive it? Check your spam filters or{' '}
                  <button onClick={() => setStatus('idle')} className="fp-btn-link-inline">
                    try again
                  </button>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                
                {/* Standard Warning Log Window */}
                {status === 'error' && (
                  <div className="auth-alert error">
                    ⚠️ {message}
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="fp-input-label">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="fp-input-field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn-primary auth-submit-btn"
                >
                  {status === 'loading' ? 'Transmitting Link...' : 'Send Reset Link'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;