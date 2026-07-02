import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { title: 'AI Content Generator', desc: 'Upload your PDF lectures and generate perfectly structured Quizzes, Assignments, Midterms, and Final Exams in seconds.' },
  { title: 'Smart Assignments', desc: 'Create, distribute, and grade assignments in one unified workflow. Student submissions are organized automatically.' },
  { title: 'Performance Analytics', desc: 'Beautiful dashboards showing student progress, submission rates, and grade distributions — export to Excel with one click.' },
  { title: 'Digital Attendance', desc: 'Mark daily attendance in seconds, auto-calculate percentages, and automatically flag at-risk students for review.' },
  { title: 'Live Quizzes', desc: 'Conduct timed, real-time quiz sessions that students can join instantly. Auto-graded with instant leaderboard results.' },
  { title: 'Course Management', desc: 'Organize content by semester and course. Upload lecture PDFs, create quizzes, and track student enrollment all in one place.' },
];

const STATS = [
  { value: '10x', label: 'Faster Quiz Creation' },
  { value: '500+', label: 'Questions Generated Daily' },
  { value: '98%', label: 'Accuracy from Lectures' },
  { value: '60s', label: 'From PDF to Full Exam' },
];

const STEPS = [
  { num: '01', title: 'Upload Your Lecture', desc: 'Simply drag and drop your PDF lecture slides. Our system processes and indexes the content instantly.' },
  { num: '02', title: 'Choose Content Type', desc: 'Select from Quizzes, Assignments, Midterms, or Final Exams. Configure difficulty and number of questions.' },
  { num: '03', title: 'Generate & Export', desc: 'Gemini AI reads your exact lecture notes and produces a polished document. Download as PDF or Word instantly.' },
];

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-wrapper">
      {/* ===== NAVBAR ===== */}
      <nav className={`lp-navbar ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <div className="lp-nav-container">
          <div className="lp-logo-box">
            <div className="lp-logo-icon">🎓</div>
            <span className="lp-logo-text">AI Teaching Assistant</span>
          </div>

          <div className="lp-nav-links lp-desktop-only">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#about">About</a>
          </div>

          <div className="lp-nav-actions lp-desktop-only">
            <Link to="/login" className="lp-login-link">Log In</Link>
            <Link to="/signup" className="lp-signup-btn">Get Started Free</Link>
          </div>

          <button className="lp-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className={`lp-bar ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`lp-bar ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`lp-bar ${mobileMenuOpen ? 'open' : ''}`}></div>
          </button>
        </div>

        <div className={`lp-mobile-nav-overlay ${mobileMenuOpen ? 'show' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
          <Link to="/signup" className="lp-mobile-signup-btn" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="lp-hero-section">
        <div className="lp-hero-grid-bg" />
        <div className="lp-hero-container">
          <div className="lp-hero-content">
            <h1>The Smarter Way to<br /><span className="lp-gradient-text">Teach & Assess</span> Your Students</h1>
            <p>Upload your lecture slides and instantly generate professional Quizzes, Assignments, Midterms, and Final Exams — perfectly tailored to your course content.</p>
            <div className="lp-hero-btns">
              <Link to="/signup" className="lp-hero-btn-primary">Start for Free →</Link>
              <Link to="/login" className="lp-hero-btn-secondary">Log In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="lp-stats-bar">
        <div className="lp-container lp-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="lp-stat-item">
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">Everything you need</span>
            <h2>Built for Modern Educators</h2>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="lp-feature-card">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="lp-section lp-light-bg">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-tag">Simple process</span>
            <h2>From Lecture to Exam in 3 Steps</h2>
          </div>
          <div className="lp-workflow-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="lp-step-card">
                <span className="lp-step-tag">STEP {step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <p>© 2026 AI Teaching Assistant. Final Year Project.</p>
        </div>
      </footer>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .lp-wrapper { font-family: 'Inter', -apple-system, sans-serif; background: #ffffff; color: #0f172a; overflow-x: hidden; }
        
        /* Navigation Bar Framework */
        .lp-navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; height: 72px; display: flex; align-items: center; padding: 0 40px; transition: all 0.3s ease; background: transparent; }
        .lp-navbar.scrolled, .lp-navbar.mobile-active { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(16px); border-bottom: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        
        .lp-nav-container { max-width: 1200px; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .lp-logo-box { display: flex; align-items: center; gap: 10px; z-index: 1100; }
        .lp-logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #1d4ed8, #0284c7); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .lp-logo-text { font-weight: 800; font-size: 1.1rem; color: #ffffff; transition: color 0.3s; }
        .lp-navbar.scrolled .lp-logo-text, .lp-navbar.mobile-active .lp-logo-text { color: #0f172a; }
        
        .lp-nav-links { display: flex; gap: 32px; }
        .lp-nav-links a { text-decoration: none; font-size: 0.9rem; font-weight: 600; color: rgba(255, 255, 255, 0.9); transition: color 0.2s; }
        .lp-navbar.scrolled .lp-nav-links a { color: #475569; }
        .lp-navbar.scrolled .lp-nav-links a:hover { color: #1d4ed8; }
        
        .lp-nav-actions { display: flex; gap: 20px; align-items: center; }
        .lp-login-link { text-decoration: none; color: #ffffff; font-weight: 600; font-size: 0.9rem; transition: color 0.2s; }
        .lp-navbar.scrolled .lp-login-link { color: #475569; }
        .lp-signup-btn { background: #ffffff; color: #1d4ed8; text-decoration: none; font-size: 0.85rem; font-weight: 700; padding: 10px 20px; border-radius: 8px; transition: all 0.2s; }
        .lp-navbar.scrolled .lp-signup-btn { background: #1d4ed8; color: #ffffff; }
        
        /* Mobile Menu Adaptive Drawer */
        .lp-menu-toggle { display: none; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; z-index: 1200; padding: 4px; }
        .lp-menu-toggle .lp-bar { width: 24px; height: 2px; background: #ffffff; transition: all 0.3s ease; }
        .lp-navbar.scrolled .lp-bar, .lp-navbar.mobile-active .lp-bar { background: #0f172a; }
        .lp-menu-toggle .lp-bar.open:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .lp-menu-toggle .lp-bar.open:nth-child(2) { opacity: 0; }
        .lp-menu-toggle .lp-bar.open:nth-child(3) { transform: rotate(-45deg) translate(6px, -6px); }
        
        .lp-mobile-nav-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: #ffffff; z-index: 1050; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; transform: translateY(-100%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .lp-mobile-nav-overlay.show { transform: translateY(0); }
        .lp-mobile-nav-overlay a { font-size: 1.35rem; font-weight: 800; color: #0f172a; text-decoration: none; }
        .lp-mobile-signup-btn { background: #1d4ed8; color: #ffffff !important; padding: 12px 36px; border-radius: 8px; font-size: 1rem !important; }
        
        /* Hero Portal Layout */
        .lp-hero-section { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 35%, #0891b2 100%); min-height: 100vh; display: flex; align-items: center; padding: 120px 40px 60px; position: relative; overflow: hidden; }
        .lp-hero-grid-bg { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 30px 30px; }
        .lp-hero-container { max-width: 1100px; margin: 0 auto; width: 100%; position: relative; }
        .lp-hero-content { max-width: 680px; }
        .lp-hero-content h1 { font-size: clamp(2.2rem, 6vw, 3.8rem); font-weight: 900; color: #ffffff; line-height: 1.1; margin-bottom: 24px; letter-spacing: -1.5px; }
        .lp-gradient-text { background: linear-gradient(90deg, #38bdf8, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .lp-hero-content p { color: rgba(255,255,255,0.85); font-size: 1.15rem; line-height: 1.7; margin-bottom: 36px; }
        .lp-hero-btns { display: flex; gap: 16px; flex-wrap: wrap; }
        .lp-hero-btn-primary { background: #ffffff; color: #1d4ed8; padding: 16px 36px; border-radius: 10px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 25px rgba(0,0,0,0.1); transition: background 0.2s, transform 0.1s; }
        .lp-hero-btn-primary:hover { background: #f8fafc; }
        .lp-hero-btn-secondary { color: #ffffff; border: 1px solid rgba(255,255,255,0.3); padding: 16px 32px; border-radius: 10px; font-weight: 600; text-decoration: none; background: rgba(255,255,255,0.05); backdrop-filter: blur(8px); transition: background 0.2s; }
        .lp-hero-btn-secondary:hover { background: rgba(255,255,255,0.1); }
        .lp-hero-btn-primary:active, .lp-hero-btn-secondary:active { transform: scale(0.98); }
        
        /* Stats Segment Bar */
        .lp-stats-bar { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .lp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 48px 0; text-align: center; }
        .lp-stat-item { display: flex; flex-direction: column; gap: 4px; }
        .lp-stat-value { font-size: 2.6rem; font-weight: 900; color: #1d4ed8; line-height: 1; }
        .lp-stat-label { color: #64748b; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Core Modules Presentation Layouts */
        .lp-section { padding: 100px 40px; }
        .lp-light-bg { background: #f8fafc; }
        .lp-container { max-width: 1100px; margin: 0 auto; width: 100%; }
        .lp-section-header { text-align: center; margin-bottom: 60px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .lp-section-header h2 { font-size: 2.4rem; font-weight: 900; letter-spacing: -1px; color: #0f172a; }
        .lp-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(29,78,216,0.08); }
        
        .lp-features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .lp-feature-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .lp-feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.04); }
        .lp-feature-card h3 { color: #0f172a; font-weight: 800; font-size: 1.2rem; margin-bottom: 10px; letter-spacing: -0.2px; }
        .lp-feature-card p { color: #64748b; font-size: 0.925rem; line-height: 1.6; }
        
        /* Workflow Execution Path */
        .lp-workflow-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .lp-step-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px 32px; position: relative; display: flex; flex-direction: column; gap: 12px; }
        .lp-step-card h3 { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-top: 4px; }
        .lp-step-card p { color: #64748b; font-size: 0.9rem; line-height: 1.6; }
        .lp-step-tag { position: absolute; top: -14px; left: 28px; background: #1d4ed8; color: #ffffff; padding: 4px 14px; border-radius: 50px; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(29,78,216,0.15); }
        
        /* Global Portal Footer primitive elements bindings */
        .lp-footer { background: #0f172a; color: rgba(255,255,255,0.4); padding: 40px; border-top: 1px solid #1e293b; text-align: center; font-size: 0.85rem; font-weight: 500; }
        
        /* Responsive Media Query Adaptations matrix */
        @media (max-width: 992px) {
          .lp-desktop-only { display: none !important; }
          .lp-menu-toggle { display: flex; }
          .lp-hero-content { max-width: 100%; text-align: center; }
          .lp-hero-btns { justify-content: center; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; padding: 40px 20px; }
          .lp-navbar { padding: 0 24px; }
        }
        
        @media (max-width: 600px) {
          .lp-stats-grid { grid-template-columns: 1fr; gap: 24px; }
          .lp-section-header h2 { font-size: 1.85rem; }
          .lp-hero-section, .lp-section { padding: 80px 24px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;