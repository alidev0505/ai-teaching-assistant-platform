import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

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

  if (loading) return <div className="ta-splash-text gray-prompt">Loading analytical telemetry data streams...</div>;
  if (!data) return <div className="ta-splash-text error-prompt">System tracking error: Unable to compute course metric data logs.</div>;

  const safeStudents = (data.kpi?.students || 0) - (data.kpi?.at_risk_count || 0);
  const riskData = [
    { name: 'Safe Status', value: safeStudents },
    { name: 'At Risk', value: data.kpi?.at_risk_count || 0 }
  ];
  const RISK_COLORS = ['#10b981', '#ef4444']; 
  const assignmentData = data.assignment_charts || [];

  return (
    <div className="ta-page-wrapper">
      
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
    </div>
  );
};

// ✅ REFACTOR: Structural uncoupling shifts inline layout properties directly into CSS descriptors
const KPICard = ({ title, value, variant, isAlert }) => (
  <div className={`ta-kpi-node-card kpi-border-accent-${variant} ${isAlert ? 'ta-kpi-alert-flash-state' : ''}`}>
    <p className="ta-kpi-card-label-header">{title}</p>
    <h2 className="ta-kpi-card-integer-value">{value}</h2>
  </div>
);

export default TeacherAnalytics;