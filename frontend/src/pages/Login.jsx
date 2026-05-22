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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setNotVerified(false); 
    setLoading(true);
    
    try {
      const user = await loginUser(formData.email, formData.password);
      
      // ✅ SAFETY FIX: Graceful navigation routes that shield against response drops
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        setNotVerified(true);
      } else {
        setError(errData?.error || 'Invalid credentials. Please verify your data entry.');
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
                {/* ✅ VISUAL FIX: Restructured the hidden element state to remain fully visible */}
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

            {/* ✅ LAYOUT OPIUM: Removed messy structural hardcoded widths */}
            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer-prompt">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;