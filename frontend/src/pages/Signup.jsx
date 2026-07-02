import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'student', university_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email.trim()) return setError('Email address is required.');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) return setError('Please enter a valid email address.');

    setLoading(true);
    try {
      await signup(formData);
      setSignedUpEmail(formData.email);
      setSignedUp(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup sequence failed. Please crosscheck registration credentials.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-stack">
        
        {/* Header Block Banner */}
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Join AI Teaching Assistant and start learning smarter</p>
        </div>

        {/* Dynamic State Enrollment Console */}
        <div className="auth-card">
          {signedUp ? (
            <div className="auth-success-state-container">
              <div className="auth-success-icon">📬</div>
              <h2 className="auth-success-title">Verify your email</h2>
              <div className="auth-alert success">
                A verification link has been sent to <strong>{signedUpEmail}</strong>.<br />
                Click the link inside your inbox to activate your platform profile access.
              </div>
              <p className="auth-success-disclaimer">Didn't receive it? Make sure to double-check your spam filters.</p>
              <Link to="/login" className="btn-primary auth-submit-btn text-center-link">
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              {error && <div className="auth-alert error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Responsive Dual Column Roster Coordinates */}
                <div className="auth-row-grid">
                  <div className="auth-form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="username" 
                      placeholder="John Doe" 
                      required 
                      onChange={handleChange} 
                    />
                  </div>
                  <div className="auth-form-group">
                    <label>University ID</label>
                    <input 
                      type="text" 
                      name="university_id" 
                      placeholder="BAI-22F-001" 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="student@university.edu" 
                    required 
                    onChange={handleChange} 
                  />
                </div>

                <div className="auth-form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      placeholder="Create a strong password" 
                      required 
                      onChange={handleChange} 
                    />
                    <button 
                      type="button" 
                      className="password-toggle-icon"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide character entries" : "Show plaintext entries"}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary auth-submit-btn">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="auth-legal-fineprint">
                By signing up, you agree to our{' '}
                <span className="auth-legal-link">Terms</span> and{' '}
                <span className="auth-legal-link">Privacy Policy</span>.
              </p>
            </>
          )}
        </div>

        <p className="auth-footer-prompt">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
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
          max-width: 480px;
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

        .auth-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
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

        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .text-center-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .auth-legal-fineprint {
          text-align: center;
          color: #64748b;
          font-size: 0.82rem;
          margin-top: 18px;
          margin-bottom: 0;
          line-height: 1.4;
        }

        .auth-legal-link {
          color: #4f46e5;
          font-weight: 600;
          cursor: pointer;
        }

        .auth-legal-link:hover {
          text-decoration: underline;
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

        /* Success State Display elements */
        .auth-success-state-container {
          text-align: center;
          animation: scaleUp 0.2s ease-out;
        }

        .auth-success-icon {
          font-size: 3.5rem;
          margin-bottom: 12px;
          line-height: 1;
        }

        .auth-success-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px 0;
          letter-spacing: -0.03em;
        }

        .auth-success-disclaimer {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 14px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        /* Status Window Components Mappings */
        .auth-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 20px;
          line-height: 1.4;
          box-sizing: border-box;
          text-align: left;
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

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 540px) {
          .auth-row-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
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

export default Signup;