import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate(); // React Router navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setNotVerified(false); 
    setLoading(true);

    try {
      // 👇 Removed the artificial 10-second Promise.race timeout. 
      // This allows sleeping cloud servers time to wake up without throwing false network errors.
      const user = await loginUser(formData.email, formData.password);

      // 👇 Replaced window.location.href with navigate(). 
      // This preserves React state and prevents the app from hanging on a hard reload.
      if (user?.role === 'admin') {
        navigate('/admin');
      } else if (user?.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }

    } catch (err) {
      console.error("🔥 LOGIN ERROR TRACE:", err);

      const errData = err.response?.data;
      if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        setNotVerified(true);
      } else {
        setError(errData?.error || err.message || 'Invalid credentials or network failure.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-stack">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <div className="auth-card">
          {error && <div className="auth-alert error">⚠️ {error}</div>}

          {notVerified && (
            <div className="auth-alert warning">
              📧 <strong>Please verify your email first.</strong><br />
              Check your inbox or <Link to="/signup">sign up again</Link>.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="auth-form-group">
              <div className="auth-label-row">
                <label>Password</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-prompt">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .auth-page-wrapper {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .auth-card-stack {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-header {
          text-align: center;
        }

        .auth-header h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
          letter-spacing: -0.05em;
        }

        .auth-header p {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0;
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

        .auth-form-group label {
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
        }

        .auth-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .auth-label-row a {
          color: #4f46e5;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
        }

        .auth-label-row a:hover {
          text-decoration: underline;
        }

        .auth-form-group input {
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

        .auth-form-group input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Password Wrapper and Toggle Layout */
        .password-input-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          padding-right: 44px;
        }

        .password-toggle-icon {
          position: absolute;
          right: 4px;
          height: calc(100% - 8px);
          width: 36px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          outline: none;
          user-select: none;
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

        .auth-footer-prompt {
          text-align: center;
          margin-top: 24px;
          margin-bottom: 0;
          font-size: 0.9rem;
          color: #64748b;
        }

        .auth-footer-prompt a {
          color: #4f46e5;
          font-weight: 700;
          text-decoration: none;
        }

        .auth-footer-prompt a:hover {
          text-decoration: underline;
        }

        /* Alert Notifications View Window */
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

        .auth-alert.warning {
          background-color: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }

        .auth-alert.warning a {
          color: #b45309;
          font-weight: 700;
          text-decoration: underline;
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 24px 20px;
          }
          .auth-header h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;