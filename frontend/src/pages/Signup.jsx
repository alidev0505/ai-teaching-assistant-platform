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
                    {/* ✅ FIX: Fixed the visibility toggler state parameters */}
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
    </div>
  );
};

export default Signup;