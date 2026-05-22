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
    </div>
  );
};

export default LandingPage;