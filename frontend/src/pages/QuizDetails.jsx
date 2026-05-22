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
      // ✅ API HANDSHAKE FIX: Routed via master dynamic api settings wrapper cleanly
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
            <h2 className="qd-kpi-integer-value">{stats.average_score}%</h2>
            <p className="qd-kpi-string-label">Average Score Ratio</p>
          </div>
          <div className="qd-kpi-node-card kpi-top-edge-emerald">
            <h2 className="qd-kpi-integer-value">{stats.highest_score}%</h2>
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
                                {s.score}%
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
    </div>
  );
};

export default QuizDetails;