import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizStats } from '../services/api';
import api from '../services/api'; 
import Navbar from '../components/Navbar';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';

const QuizDetails = () => {
  const { id, quizId } = useParams(); 
  const actualId = quizId || id;
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [actualId]);

  const fetchData = async () => {
    try {
      const res = await getQuizStats(actualId);
      setStats(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch evaluative quiz telemetry data.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNow = async () => {
    if (!window.confirm("Do you want to assign this quiz to students immediately?")) return;
    
    setAssigning(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post(`/quiz/${actualId}/assign`, { is_published: true });

      if (res?.status === 200 || res?.data) {
        setSuccess("🚀 Quiz assigned to student streams successfully!");
        fetchData();
      } else {
        setError("Transaction Error: Failed to publish quiz channel.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error connecting to service nodes.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return (
    <div className="qd-page-layout">
        <Navbar />
        <div className="qd-splash-loading-text">Loading analytical assessment summaries...</div>
    </div>
  );

  if (!stats) return (
    <div className="qd-page-layout">
        <Navbar />
        <div className="qd-splash-loading-text qd-error-prompt">No analytical summary dataset found for this quiz ID token.</div>
    </div>
  );

  return (
    <div className="qd-page-layout">
      <Navbar />
      
      {/* ── 1. HERO BANNER HEADER CONSOLE ── */}
      <div className="qd-hero-banner">
        <div className="qd-grid-mesh" />
        <div className="qd-hero-container">
            <div className="qd-hero-flex-header-row">
                <div className="qd-hero-text-block">
                    <button onClick={() => navigate(-1)} className="qd-btn-back-hero">← Back</button>
                    <h1 className="qd-hero-main-title">{stats.title}</h1>
                    
                    <div className="qd-status-meta-row-strip">
                        <span className={`qd-status-pill-badge status-pill-${stats.is_published ? 'published' : 'draft'}`}>
                            {stats.is_published ? '● Published' : '○ Draft Space'}
                        </span>
                        {stats.deadline && (
                            <span className="qd-deadline-timestamp-text">
                                📅 Cut-off Due Date: {new Date(stats.deadline).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {!stats.is_published && (
                    <button onClick={handleAssignNow} disabled={assigning} className="qd-btn-assign-trigger">
                        {assigning ? 'Publishing Matrix...' : 'Assign to Students 🚀'}
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* ── 2. CORE PERFORMANCE METRICS VIEW ── */}
      <div className="qd-main-content-workspace">
        
        {error && <div className="auth-alert error qd-spaced-banner">⚠️ {error}</div>}
        {success && <div className="auth-alert success qd-spaced-banner">✅ {success}</div>}
        
        {/* KPI Scoreboard Panels */}
        <div className="qd-kpi-grid-matrix-row-3">
          <div className="qd-kpi-node-card kpi-top-edge-blue">
            {/* 👇 UPDATED: Added Number().toFixed(2) 👇 */}
            <h2 className="qd-kpi-integer-value">{Number(stats.average_score || 0).toFixed(2)}%</h2>
            <p className="qd-kpi-string-label">Average Score Ratio</p>
          </div>
          <div className="qd-kpi-node-card kpi-top-edge-emerald">
            {/* 👇 UPDATED: Added Number().toFixed(2) 👇 */}
            <h2 className="qd-kpi-integer-value">{Number(stats.highest_score || 0).toFixed(2)}%</h2>
            <p className="qd-kpi-string-label">Highest Score Achieved</p>
          </div>
          <div className="qd-kpi-node-card kpi-top-edge-amber">
            <h2 className="qd-kpi-integer-value">{stats.total_students}</h2>
            <p className="qd-kpi-string-label">Verified Submissions</p>
          </div>
        </div>

        {/* ── 3. DATA CHARTS & LEADERBOARD ROSTERS ── */}
        <div className="qd-split-content-grid-matrix">
          
          {/* Chart Distributions Panel */}
          <div className="qd-visual-display-panel-card">
            <h3 className="qd-visual-panel-title">📈 Grade Distribution Curve</h3>
            {stats.student_scores && stats.student_scores.length > 0 ? (
              <div className="qd-chart-canvas-holder-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.student_scores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={30}>
                        {stats.student_scores.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#3b82f6' : '#ef4444'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="qd-chart-empty-placeholder">Layout waiting: Awaiting initial student assessment uploads...</div>
            )}
          </div>

          {/* Table Leaderboard Panel */}
          <div className="qd-visual-display-panel-card panel-card-remove-padding">
            <div className="qd-panel-inner-header-banner">
              <h3 className="qd-visual-panel-title remove-margin-bottom">🏆 Evaluation Leaderboard</h3>
            </div>
            
            <div className="qd-responsive-table-scroll-wrapper">
                <table className="qd-master-student-table">
                <thead>
                    <tr>
                    <th>Rank Position</th>
                    <th>Student Identifier</th>
                    <th className="qd-th-text-right">Grading Scalar</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.student_scores && stats.student_scores.map((s, idx) => (
                    <tr key={idx} className="qd-table-row-node">
                        <td className="qd-td-rank-numerical-cell">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}</td>
                        <td className="qd-td-student-meta-cell">
                            <div className="qd-student-row-name-string">{s.name}</div>
                            <div className="qd-student-row-timestamp-log">Submission parsed: {s.submitted_at}</div>
                        </td>
                        <td className="qd-td-score-badge-cell">
                            <span className={`qd-score-pill-badge pill-grading-${s.score >= 80 ? 'high' : s.score < 50 ? 'low' : 'mid'}`}>
                                {/* 👇 UPDATED: Added Number().toFixed(2) here as well 👇 */}
                                {Number(s.score || 0).toFixed(2)}%
                            </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {(!stats.student_scores || stats.student_scores.length === 0) && <p className="qd-table-empty-fallback-msg">No submissions cataloged yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES MATRIX ── */}
      <style>{`
        .qd-page-layout { background-color: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        /* Banner Header Module */
        .qd-hero-banner { background: linear-gradient(150deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .qd-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 26px 26px; pointer-events: none; }
        .qd-hero-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }
        .qd-hero-flex-header-row { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 24px; }
        .qd-hero-text-block { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 280px; }
        
        .qd-btn-back-hero { width: fit-content; background: rgba(255,255,255,0.08); color: #f1f5f9; border: 1px solid rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.825rem; font-weight: 600; margin-bottom: 8px; transition: background 0.2s; }
        .qd-btn-back-hero:hover { background: rgba(255,255,255,0.16); }
        .qd-hero-main-title { color: #ffffff; font-size: clamp(1.6rem, 5vw, 2.4rem); font-weight: 900; margin: 0; letter-spacing: -0.75px; line-height: 1.2; }
        
        .qd-status-meta-row-strip { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 4px; }
        .qd-status-pill-badge { font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .qd-status-pill-badge.status-pill-published { background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .qd-status-pill-badge.status-pill-draft { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
        .qd-deadline-timestamp-text { color: #94a3b8; font-size: 0.875rem; font-weight: 600; }
        
        .qd-btn-assign-trigger { background-color: #3b82f6; color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: background-color 0.2s, transform 0.1s; }
        .qd-btn-assign-trigger:hover:not(:disabled) { background-color: #2563eb; }
        .qd-btn-assign-trigger:active:not(:disabled) { transform: scale(0.98); }
        .qd-btn-assign-trigger:disabled { opacity: 0.6; cursor: not-allowed; }
        
        /* Central Workspace Content Elements Grid Grid Matrix */
        .qd-main-content-workspace { max-width: 1200px; margin: -50px auto 0; padding: 0 24px; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; box-sizing: border-box; }
        .qd-spaced-banner { margin-bottom: 0px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .qd-kpi-grid-matrix-row-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; width: 100%; }
        .qd-kpi-node-card { background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 4px; }
        .qd-kpi-node-card.kpi-top-edge-blue { border-top: 4px solid #3b82f6; }
        .qd-kpi-node-card.kpi-top-edge-emerald { border-top: 4px solid #10b981; }
        .qd-kpi-node-card.kpi-top-edge-amber { border-top: 4px solid #f59e0b; }
        
        .qd-kpi-integer-value { font-size: 2.2rem; font-weight: 900; color: #0f172a; line-height: 1; }
        .qd-kpi-string-label { color: #64748b; font-size: 0.825rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Layout Split Panels Distribution and Tables matrix */
        .qd-split-content-grid-matrix { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: start; width: 100%; }
        .qd-visual-display-panel-card { background: #ffffff; padding: 24px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); box-sizing: border-box; }
        .qd-visual-display-panel-card.panel-card-remove-padding { padding: 0px !important; overflow: hidden; }
        
        .qd-visual-panel-title { font-size: 1.05rem; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; letter-spacing: -0.2px; }
        .qd-visual-panel-title.remove-margin-bottom { margin-bottom: 0px !important; }
        .qd-panel-inner-header-banner { padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        
        .qd-chart-canvas-holder-box { width: 100%; height: 320px; margin-top: 10px; }
        .qd-chart-empty-placeholder { height: 320px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.9rem; font-weight: 500; border: 2px dashed #cbd5e1; border-radius: 10px; background-color: #f8fafc; }
        
        /* Table Leaderboard Configurations rules */
        .qd-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; scrollbar-width: thin; }
        .qd-master-student-table { width: 100%; border-collapse: collapse; text-align: left; }
        .qd-master-student-table th { padding: 14px 20px; background-color: #f1f5f9; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        .qd-th-text-right { text-align: right !important; }
        
        .qd-table-row-node { border-bottom: 1px solid #f1f5f9; transition: background-color 0.2s; }
        .qd-table-row-node:hover { background-color: #f8fafc; }
        .qd-table-row-node:last-child { border-bottom: none; }
        
        .qd-master-student-table td { padding: 14px 20px; vertical-align: middle; }
        .qd-td-rank-numerical-cell { font-size: 1.15rem; font-weight: 800; color: #475569; width: 60px; text-align: center; }
        .qd-td-student-meta-cell { display: flex; flex-direction: column; gap: 2px; }
        .qd-student-row-name-string { font-weight: 700; color: #1e293b; font-size: 0.925rem; }
        .qd-student-row-timestamp-log { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
        .qd-td-score-badge-cell { text-align: right; width: 90px; }
        
        .qd-score-pill-badge { font-size: 0.85rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; display: inline-block; }
        .qd-score-pill-badge.pill-grading-high { background-color: #d1fae5; color: #065f46; }
        .qd-score-pill-badge.pill-grading-mid { background-color: #dbeafe; color: #1e40af; }
        .qd-score-pill-badge.pill-grading-low { background-color: #fee2e2; color: #991b1b; }
        
        .qd-table-empty-fallback-msg { padding: 40px; text-align: center; color: #94a3b8; font-size: 0.9rem; font-weight: 500; margin: 0; }
        .qd-splash-loading-text { padding: 120px 24px; text-align: center; color: #64748b; font-weight: 600; font-size: 1rem; }
        .qd-splash-loading-text.qd-error-prompt { color: #dc2626; }
        
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }

        /* Smartphone adaptive structural adjustments shifters viewport query */
        @media (max-width: 920px) {
          .qd-split-content-grid-matrix { grid-template-columns: 1fr; gap: 20px; }
          .qd-hero-flex-header-row { flex-direction: column; align-items: stretch; gap: 16px; }
          .qd-btn-assign-trigger { width: 100%; text-align: center; }
          .qd-main-content-workspace { margin-top: -35px; }
        }
      `}</style>
    </div>
  );
};

export default QuizDetails;