import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const TeacherAnalytics = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [courseId]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/content/analytics/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) {
      console.error("Failed to fetch historical database analysis indices.", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="ta-loading-splash">
      <div className="ta-splash-text">Loading analytical telemetry data streams...</div>
      <style>{`
        .ta-loading-splash { min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .ta-splash-text { color: #64748b; font-weight: 600; font-size: 0.95rem; }
      `}</style>
    </div>
  );

  if (!data) return (
    <div className="ta-loading-splash">
      <div className="ta-splash-text text-danger">System tracking error: Unable to compute course metric data logs.</div>
      <style>{`
        .ta-loading-splash { min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .text-danger { color: #ef4444 !important; font-weight: 700; }
      `}</style>
    </div>
  );

  const safeStudents = (data.kpi?.students || 0) - (data.kpi?.at_risk_count || 0);
  const riskData = [
    { name: 'Safe Status', value: safeStudents },
    { name: 'At Risk', value: data.kpi?.at_risk_count || 0 }
  ];
  const RISK_COLORS = ['#10b981', '#ef4444']; 
  const assignmentData = data.assignment_charts || [];

  return (
    <div className="ta-page-wrapper">
      <Navbar />
      
      {/* ── 1. HERO BANNER INFRASTRUCTURE ── */}
      <div className="ta-hero-banner">
        <div className="ta-grid-mesh" />
        <div className="ta-hero-container">
          <button onClick={() => navigate(-1)} className="ta-btn-back">
            ← Back to Course Workspace
          </button>
          <h1 className="ta-hero-main-title">Course Analytics Insights</h1>
          <p className="ta-hero-subtitle">Granular performance indexing charts, operational parameters, and attendance risk diagnostics matrix.</p>
        </div>
      </div>

      <div className="ta-content-workspace">
        
        {/* ── 2. KPI METRIC SUMMARY ROW ── */}
        <div className="ta-kpi-grid-row">
          <KPICard title="Total Roster Students" value={data.kpi?.students} variant="blue" />
          <KPICard title="Live Sessions Held" value={data.kpi?.sessions_held} variant="purple" />
          <KPICard 
            title="Syllabus Attendance Avg." 
            value={`${data.kpi?.students > 0 ? Math.round(((data.kpi.students - data.kpi.at_risk_count) / data.kpi.students) * 100) : 0}%`} 
            variant="emerald" 
          />
          <KPICard 
            title="Intervention Alerts" 
            value={data.kpi?.at_risk_count} 
            variant="red" 
            isAlert={data.kpi?.at_risk_count > 0}
          />
        </div>

        {/* ── 3. CHARTS SELECTION CONSOLE PANEL ── */}
        <div className="ta-charts-main-grid-row-2">
          
          {/* Bar Chart Data Grid */}
          <div className="ta-chart-container-card">
            <h3 className="ta-chart-inner-title">📊 Assignment Submission Performance</h3>
            <div className="ta-chart-canvas-holder">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="submitted" fill="#2563eb" name="Submitted Logs" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="pending" fill="#e2e8f0" name="Missing Entries" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Framework Card */}
          <div className="ta-chart-container-card">
            <h3 className="ta-chart-inner-title">❤️ Cohort Roster Health Overview</h3>
            <div className="ta-chart-canvas-holder">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── 4. AT RISK LEDGER DATA TABLE ── */}
        <div className="ta-table-display-card-panel">
          <h3 className="ta-table-panel-inner-title">⚠️ Attendance Intervention Ledger</h3>
          <p className="ta-table-panel-inner-subtitle">Enrolled students monitoring beneath the standard threshold parameters (75% Attendance).</p>

          {(!data.at_risk_list || data.at_risk_list.length === 0) ? (
            <div className="ta-empty-intervention-success-banner">
              🎉 <strong>Excellent Academic Status!</strong> All rostered students currently reside completely inside safe attendance boundary conditions.
            </div>
          ) : (
            <div className="ta-responsive-table-scroll-wrapper">
              <table className="ta-master-table">
                <thead>
                  <tr>
                    <th>Student Name String</th>
                    <th>Attendance Scalar</th>
                    <th>Missed Classes Counter</th>
                    <th>Risk Factor Index</th>
                  </tr>
                </thead>
                <tbody>
                  {data.at_risk_list.map((s, idx) => (
                    <tr key={idx} className="ta-table-row-node">
                      <td className="ta-td-bold-title">{s.name}</td>
                      <td>
                        <span className="ta-risk-badge-alert">{s.percentage}%</span>
                      </td>
                      <td className="ta-td-muted-text">{s.missed} Classes Missing</td>
                      <td className="ta-td-critical-status">CRITICAL WARNING STATUS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN STYLES ── */}
      <style>{`
        .ta-page-wrapper { background-color: #f8fafc; min-height: 100vh; padding-bottom: 60px; font-family: 'Inter', sans-serif; }
        
        .ta-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .ta-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 28px 28px; pointer-events: none; }
        .ta-hero-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; position: relative; }
        
        .ta-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; transition: background 0.2s ease; font-family: inherit; }
        .ta-btn-back:hover { background: rgba(255, 255, 255, 0.18); }
        .ta-hero-main-title { color: #ffffff; font-size: clamp(1.8rem, 5vw, 2.4rem); font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .ta-hero-subtitle { color: rgba(255, 255, 255, 0.8); margin-top: 8px; font-size: 0.95rem; line-height: 1.5; max-width: 700px; }
        
        .ta-content-workspace { max-width: 1200px; margin: -50px auto 0; padding: 0 24px; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; box-sizing: border-box; }
        
        /* KPI Scoreboard Track Matrix Row Layout */
        .ta-kpi-grid-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; width: 100%; }
        .ta-kpi-node-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 24px; border-radius: 14px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; transition: transform 0.2s; }
        .ta-kpi-node-card:hover { transform: translateY(-2px); }
        
        .kpi-border-accent-blue { border-top: 4px solid #2563eb; }
        .kpi-border-accent-purple { border-top: 4px solid #7c3aed; }
        .kpi-border-accent-emerald { border-top: 4px solid #10b981; }
        .kpi-border-accent-red { border-top: 4px solid #ef4444; }
        
        .ta-kpi-alert-flash-state { background-color: #fff5f5; animation: ta-blink-alert 1.5s infinite alternate; }
        .ta-kpi-card-label-header { font-size: 0.775rem; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .ta-kpi-card-integer-value { font-size: 2.2rem; font-weight: 900; color: #0f172a; line-height: 1; margin: 4px 0 0 0; }
        
        /* Visual Charts Dual Panels Row Split Matrix */
        .ta-charts-main-grid-row-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; width: 100%; box-sizing: border-box; }
        .ta-chart-container-card { background: #ffffff; padding: 24px; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); box-sizing: border-box; display: flex; flex-direction: column; }
        .ta-chart-inner-title { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin: 0 0 20px 0; letter-spacing: -0.2px; }
        .ta-chart-canvas-holder { width: 100%; height: 280px; flex-grow: 1; }
        
        /* Attendance Intervention Ledger Data Tables Styles */
        .ta-table-display-card-panel { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0; animation: fadeIn 0.2s ease-out; }
        .ta-table-panel-inner-title { margin: 0; color: #0f172a; font-weight: 800; font-size: 1.15rem; letter-spacing: -0.3px; }
        .ta-table-panel-inner-subtitle { color: #64748b; font-size: 0.875rem; margin: 4px 0 24px 0; font-weight: 500; }
        
        .ta-empty-intervention-success-banner { padding: 20px; background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 12px; font-size: 0.925rem; text-align: center; }
        
        .ta-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; }
        .ta-master-table { width: 100%; border-collapse: collapse; text-align: left; }
        .ta-master-table th { padding: 14px 20px; background-color: #f8fafc; font-size: 0.775rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
        
        .ta-table-row-node { border-bottom: 1px solid #f1f5f9; transition: background-color 0.15s; }
        .ta-table-row-node:hover { background-color: #f8fafc; }
        .ta-table-row-node:last-child { border-bottom: none; }
        .ta-master-table td { padding: 14px 20px; font-size: 0.9rem; color: #334155; vertical-align: middle; }
        
        .ta-td-bold-title { font-weight: 700; color: #0f172a; }
        .ta-risk-badge-alert { background-color: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.825rem; border: 1px solid #fca5a5; }
        .ta-td-muted-text { color: #64748b; font-weight: 600; font-size: 0.85rem; }
        .ta-td-critical-status { color: #dc2626; font-weight: 800; font-size: 0.8rem; letter-spacing: 0.3px; }
        
        @keyframes ta-blink-alert { 0% { border-top-color: #fca5a5; } 100% { border-top-color: #ef4444; box-shadow: 0 0 10px rgba(239,68,68,0.1); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Tablet Responsive Viewport Adapters Matrix */
        @media (max-width: 920px) {
          .ta-charts-main-grid-row-2 { grid-template-columns: 1fr; gap: 20px; }
          .ta-hero-banner { text-align: center; padding-bottom: 80px; }
          .ta-btn-back { width: 100%; text-align: center; }
          .ta-content-workspace { margin-top: -35px; padding: 0 16px; }
          .ta-table-display-card-panel { padding: 24px; }
        }
      `}</style>
    </div>
  );
};

// ─── DECOUPLED CHILD COMPONENT ───
const KPICard = ({ title, value, variant, isAlert }) => (
  <div className={`ta-kpi-node-card kpi-border-accent-${variant} ${isAlert ? 'ta-kpi-alert-flash-state' : ''}`}>
    <p className="ta-kpi-card-label-header">{title}</p>
    <h2 className="ta-kpi-card-integer-value">{value}</h2>
  </div>
);

export default TeacherAnalytics;