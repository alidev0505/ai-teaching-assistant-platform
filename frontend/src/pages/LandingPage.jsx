import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ---- DATA ----
const FEATURES = [
  {
    title: 'AI Content Generator',
    desc: 'Upload your PDF lectures and generate perfectly structured Quizzes, Assignments, Midterms, and Final Exams in seconds.',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    title: 'Smart Assignments',
    desc: 'Create, distribute, and grade assignments in one unified workflow. Student submissions are organized automatically.',
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    title: 'Performance Analytics',
    desc: 'Beautiful dashboards showing student progress, submission rates, and grade distributions — export to Excel with one click.',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    title: 'Digital Attendance',
    desc: 'Mark daily attendance in seconds, auto-calculate percentages, and automatically flag at-risk students for review.',
    color: '#dc2626',
    bg: '#fef2f2',
  },
  {
    title: 'Live Quizzes',
    desc: 'Conduct timed, real-time quiz sessions that students can join instantly. Auto-graded with instant leaderboard results.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    title: 'Course Management',
    desc: 'Organize content by semester and course. Upload lecture PDFs, create quizzes, and track student enrollment all in one place.',
    color: '#d97706',
    bg: '#fffbeb',
  },
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

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
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
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#fff', color: '#0f172a', overflowX: 'hidden' }}>

      {/* ===== NAVBAR ===== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <div className="nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1100 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🎓</div>
            <span className="logo-text">AI Teaching Assistant</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="nav-links desktop-only">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="nav-item">{link.label}</a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="nav-actions desktop-only">
            <Link to="/login" className="login-link">Log In</Link>
            <Link to="/signup" className="signup-btn">Get Started Free</Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className={`bar ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`bar ${mobileMenuOpen ? 'open' : ''}`}></div>
            <div className={`bar ${mobileMenuOpen ? 'open' : ''}`}></div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-nav-overlay ${mobileMenuOpen ? 'show' : ''}`}>
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
          ))}
          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
          <Link to="/signup" className="mobile-signup-btn" onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        <div className="hero-grid-bg" />
        <div className="hero-blob-1" />
        <div className="hero-blob-2" />

        <div className="hero-container">
          <div className="hero-text-content">
            <h1>
              The Smarter Way to<br />
              <span className="gradient-text">Teach & Assess</span><br />
              Your Students
            </h1>
            <p>
              Upload your lecture slides and instantly generate professional Quizzes, Assignments, Midterms, and Final Exams — perfectly tailored to your course content.
            </p>
            <div className="hero-btns">
              <Link to="/signup" className="hero-btn-primary">Start for Free →</Link>
              <Link to="/login" className="hero-btn-secondary">Log In</Link>
            </div>
            <p className="hero-check-text">
              ✓ No credit card required &nbsp;·&nbsp; ✓ Free for educators
            </p>
          </div>

          {/* RIGHT - Feature Preview Card */}
          <div className="hero-card-container desktop-only">
            <div className="feature-preview-card">
              <div style={{ display: 'flex', gap: '7px', marginBottom: '20px' }}>
                {['#ef4444', '#f59e0b', '#10b981'].map(c => <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}
              </div>
              <div className="content-type-box">
                <div className="label">Content Type</div>
                <div className="pill-group">
                  {['Quiz', 'Assignment', 'Final Exam'].map((t, i) => (
                    <div key={t} className={`pill ${i === 2 ? 'active' : ''}`}>{t}</div>
                  ))}
                </div>
              </div>

              <div className="ai-chat-box">
                <div className="chat-bubble">
                Generated Final Exam from Lecture 4 with 10 MCQs and 6 long-answer questions...
                </div>
                <div className="chat-actions">
                  <div className="action-btn blue">Student Copy</div>
                  <div className="action-btn green">Answer Key</div>
                </div>
              </div>
            </div>

            <div className="hero-badge">
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', lineHeight: 1 }}>60 sec</div>
                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>PDF → Exam</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="stats-bar">
        <div className="stats-grid">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="section-padding">
        <div className="container">
          <div className="section-header">
            <div className="tag-blue">Everything you need</div>
            <h2>Built for Modern Educators</h2>
            <p>Every feature is purpose-built to save teacher time and improve student outcomes.</p>
          </div>

          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <h3 style={{ color: '#0f172a', fontWeight: '800', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.65' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="section-padding light-bg">
        <div className="container">
          <div className="section-header">
            <div className="tag-blue-light">Simple process</div>
            <h2>From Lecture to Exam in 3 Steps</h2>
          </div>

          <div className="workflow-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="step-card">
                <div className="step-tag">STEP {step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Teach Smarter?</h2>
          <div className="cta-btns">
            <Link to="/signup" className="cta-btn-white">Create Free Account</Link>
            <Link to="/login" className="cta-btn-outline">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #1d4ed8, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎓</div>
               <span style={{ fontWeight: '800' }}>AI Teaching Assistant</span>
            </div>
            <div className="footer-links">
               {NAV_LINKS.map(link => <a key={link.label} href={link.href}>{link.label}</a>)}
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 AI Teaching Assistant. Final Year Project.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        /* --- Navbar Styles --- */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          height: 72px; display: flex; align-items: center; padding: 0 40px;
          transition: all 0.3s ease;
        }
        .navbar.scrolled, .navbar.mobile-active {
          background: rgba(255,255,255,0.98); backdrop-filter: blur(16px);
          border-bottom: 1px solid #e2e8f0; box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }
        .logo-text { font-weight: 800; font-size: 1.1rem; color: white; transition: color 0.3s; }
        .scrolled .logo-text, .mobile-active .logo-text { color: #0f172a; }

        .nav-container { max-width: 1200px; width: 100%; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .nav-links { display: flex; gap: 32px; }
        .nav-item { text-decoration: none; font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9); transition: 0.2s; }
        .scrolled .nav-item { color: #475569; }
        .scrolled .nav-item:hover { color: #1d4ed8; }

        .nav-actions { display: flex; gap: 15px; align-items: center; }
        .login-link { text-decoration: none; color: white; font-weight: 600; font-size: 0.9rem; }
        .scrolled .login-link { color: #475569; }
        .signup-btn { background: white; color: #1d4ed8; text-decoration: none; font-size: 0.85rem; font-weight: 700; padding: 10px 20px; border-radius: 8px; transition: 0.3s; }
        .scrolled .signup-btn { background: #1d4ed8; color: white; }

        /* --- Mobile Toggle --- */
        .menu-toggle { display: none; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; z-index: 1200; }
        .menu-toggle .bar { width: 26px; height: 2px; background: white; transition: 0.3s; }
        .scrolled .menu-toggle .bar, .mobile-active .menu-toggle .bar { background: #0f172a; }
        .menu-toggle .bar.open:nth-child(1) { transform: rotate(45deg) translate(6px, 5px); }
        .menu-toggle .bar.open:nth-child(2) { opacity: 0; }
        .menu-toggle .bar.open:nth-child(3) { transform: rotate(-45deg) translate(6px, -5px); }

        .mobile-nav-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: white; z-index: 1050; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; transform: translateY(-100%); transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
        .mobile-nav-overlay.show { transform: translateY(0); }
        .mobile-nav-overlay a { font-size: 1.5rem; font-weight: 800; color: #0f172a; text-decoration: none; }
        .mobile-signup-btn { background: #1d4ed8; color: white !important; padding: 15px 40px; border-radius: 10px; }

        /* --- Hero --- */
        .hero-section { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 35%, #1d6fa4 65%, #0891b2 100%); min-height: 100vh; display: flex; align-items: center; padding: 120px 40px 60px; position: relative; overflow: hidden; }
        .hero-grid-bg { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 30px 30px; }
        .hero-container { max-width: 1100px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; position: relative; }
        .hero-text-content h1 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 900; color: white; line-height: 1.1; margin-bottom: 24px; letter-spacing: -1.5px; }
        .gradient-text { background: linear-gradient(90deg, #38bdf8, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-text-content p { color: rgba(255,255,255,0.8); font-size: 1.1rem; line-height: 1.7; margin-bottom: 40px; max-width: 500px; }
        .hero-btns { display: flex; gap: 15px; flex-wrap: wrap; }
        .hero-btn-primary { background: white; color: #1d4ed8; padding: 16px 36px; border-radius: 10px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .hero-btn-secondary { color: white; border: 1px solid rgba(255,255,255,0.3); padding: 16px 32px; border-radius: 10px; font-weight: 600; text-decoration: none; background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); }
        .hero-check-text { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-top: 16px; }

        /* --- Mockup Card --- */
        .feature-preview-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 24px; padding: 32px; backdrop-filter: blur(20px); }
        .content-type-box { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1); }
        .label { color: rgba(255,255,255,0.4); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .pill-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; }
        .pill.active { background: #ef4444; border: none; font-weight: 700; }
        .ai-chat-box { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); }
        .chat-bubble { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; color: rgba(255,255,255,0.9); font-size: 0.8rem; margin-bottom: 12px; line-height: 1.5; }
        .chat-actions { display: flex; justify-content: flex-end; gap: 8px; }
        .action-btn { padding: 6px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
        .action-btn.blue { background: #2563eb; color: white; }
        .action-btn.green { background: #10b981; color: white; }
        .hero-badge { position: absolute; bottom: -20px; right: 20px; background: white; padding: 12px 20px; border-radius: 14px; box-shadow: 0 15px 30px rgba(0,0,0,0.1); display: flex; gap: 10px; align-items: center; }

        /* --- Sections --- */
        .section-padding { padding: 100px 40px; }
        .light-bg { background: #f8fafc; }
        .container { max-width: 1100px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 70px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; }
        .tag-blue { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 6px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; }
        .tag-blue-light { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 6px 16px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; }

        /* --- Grids --- */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .feature-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px; transition: 0.3s; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }

        .stats-bar { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 60px 40px; }
        .stats-grid { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
        .stat-value { font-size: 2.5rem; font-weight: 900; color: #1d4ed8; }
        .stat-label { color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }

        .workflow-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
        .step-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 45px 35px; position: relative; }
        .step-tag { position: absolute; top: -15px; left: 30px; background: #1d4ed8; color: white; padding: 5px 15px; border-radius: 50px; font-size: 0.7rem; font-weight: 900; }

        .cta-section { background: #0c1445; padding: 100px 40px; text-align: center; color: white; }
        .cta-container h2 { font-size: 2.8rem; font-weight: 900; }
        .cta-btns { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 30px; }
        .cta-btn-white { background: white; color: #0c1445; padding: 16px 40px; border-radius: 10px; font-weight: 800; text-decoration: none; }
        .cta-btn-outline { border: 1px solid rgba(255,255,255,0.3); padding: 16px 40px; border-radius: 10px; color: white; text-decoration: none; }

        .footer { background: #060d1f; color: white; padding: 60px 40px; }
        .footer-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 30px; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 40px; }
        .footer-links { display: flex; gap: 30px; }
        .footer-links a { color: #64748b; text-decoration: none; font-size: 0.9rem; }
        .footer-bottom { text-align: center; opacity: 0.4; font-size: 0.8rem; }

        /* --- MEDIA QUERIES --- */
        @media (max-width: 992px) {
          .desktop-only { display: none; }
          .menu-toggle { display: flex; }
          .hero-container { grid-template-columns: 1fr; text-align: center; }
          .hero-text-content p { margin: 0 auto 40px; }
          .hero-btns { justify-content: center; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
          .navbar { padding: 0 20px; }
        }

        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr; }
          .section-header h2 { font-size: 2rem; }
          .cta-container h2 { font-size: 2rem; }
          .hero-section, .section-padding, .cta-section, .footer { padding: 80px 20px; }
          .footer-top { flex-direction: column; text-align: center; }
          .footer-links { flex-direction: column; gap: 15px; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;