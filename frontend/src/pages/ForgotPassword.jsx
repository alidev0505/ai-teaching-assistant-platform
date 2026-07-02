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
            <h1 className="fp-main-title">Forgot Password?</h1>
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

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .fp-page-wrapper {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .fp-navbar {
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

        .fp-brand-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .fp-logo-badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #0ea5e9);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .fp-brand-text {
          font-weight: 800;
          color: #0f172a;
          font-size: 1.1rem;
          letter-spacing: -0.025em;
        }

        .fp-login-back-link {
          color: #4f46e5;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .fp-login-back-link:hover {
          color: #4338ca;
          text-decoration: underline;
        }

        .fp-body-layout {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .fp-stack-container {
          width: 100%;
          max-width: 440px;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fp-form-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .fp-key-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          line-height: 1;
        }

        .fp-main-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px 0;
          letter-spacing: -0.05em;
        }

        .fp-subtitle {
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
        }

        .auth-form-group {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fp-input-label {
          display: block;
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
        }

        .fp-input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          color: #0f172a;
          background-color: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .fp-input-field:focus {
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
          transition: background-color 0.2s, transform 0.1s;
        }

        .auth-submit-btn:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Status Alerts wrapper mapping matches system standard context */
        .auth-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 20px;
          line-height: 1.4;
          display: flex;
          align-items: center;
          gap: 8px;
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

        /* Success Interface Area elements layout */
        .fp-success-console {
          text-align: center;
          animation: scaleUp 0.2s ease-out;
        }

        .fp-success-art {
          font-size: 3.5rem;
          margin-bottom: 16px;
          line-height: 1;
        }

        .fp-retry-disclaimer {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-top: 16px;
        }

        .fp-btn-link-inline {
          background: none;
          border: none;
          color: #4f46e5;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
          font-size: inherit;
          font-family: inherit;
          text-decoration: underline;
        }

        .fp-btn-link-inline:hover {
          color: #4338ca;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Smartphone adaptive layout shifters bounds query */
        @media (max-width: 600px) {
          .fp-navbar {
            padding: 0 20px;
          }
          .auth-card {
            padding: 24px;
          }
          .fp-main-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;