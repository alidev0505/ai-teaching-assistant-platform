import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOverview } from '../../services/api';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await getAdminOverview();
      setData(res?.data || null);
    } catch (err) { 
      console.error("Failed to load global administrative overview telemetry logs:", err); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="adb-splash-container gray-prompt">
      <div className="adc-spinner" />
      <h2>Loading Platform Dashboard Telemetry...</h2>
      <style>{`
        .adb-splash-container { min-height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; gap: 16px; }
        .adc-spinner { width: 44px; height: 44px; border: 4px solid #cbd5e1; border-top-color: #4f46e5; border-radius: 50%; animation: adc-spin 0.8s linear infinite; }
        .gray-prompt h2 { color: #475569; font-weight: 600; font-size: 0.95rem; }
        @keyframes adc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (!data) return (
    <div className="adb-splash-container error-prompt">
      <h2>System Overhaul Warning: Failed to calculate master dataset fields index.</h2>
      <style>{`
        .adb-splash-container { min-height: 100vh; background-color: #f8fafc; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; }
        .error-prompt h2 { color: #dc2626; font-weight: 600; font-size: 1rem; }
      `}</style>
    </div>
  );

  const roleDistribution = [
    { name: 'Students Space', value: Number(data.kpi?.students) || 0 },
    { name: 'Faculty Instructors', value: Number(data.kpi?.teachers) || 0 },
  ];
  
  const chartData = data.chart && data.chart.length > 0 ? data.chart : [];
  const COLORS = ['#6366f1', '#10b981']; 

  return (
    <div className="sa-page-wrapper">
      
      {/* ── 1. GLOBAL ADMIN BANNER CONSOLE NAVIGATION ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <h1 className="adm-hero-main-title">Admin Command Console</h1>
          <p className="adm-hero-subtitle">Real-time status monitor over infrastructure partitions, vector pipelines, and metrics.</p>
        </div>
      </div>

      <div className="adm-content-workspace max-width-wide">
        
        {/* ── 2. METRICS SCOREBOARD INDEX ROW ── */}
        <div className="sa-stats-grid-row adb-spaced-row-margin">
          <KPICard title="Total Active Students" value={data.kpi?.students} variant="blue" />
          <KPICard title="Rostered Instructors" value={data.kpi?.teachers} variant="emerald" />
          <KPICard title="Indexed Syllabus Channels" value={data.kpi?.courses} variant="amber" />
          <KPICard title="Calculated Submissions" value={data.kpi?.submissions} variant="red" />
        </div>

        {/* ── 3. VISUAL TELEMETRY SYSTEM GRAPHICS GRID ── */}
        <div className="ta-charts-main-grid-row-2 adb-spaced-row-margin">
          
          {/* Submissions Traffic Progression Graph */}
          <div className="card adb-panel-card-container">
            <h3 className="ta-chart-inner-title">📈 System Transmission Activity Trails</h3>
            <div className="ta-chart-canvas-holder">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="submissions" stroke="#6366f1" fillOpacity={1} fill="url(#colorSub)" strokeWidth={3} name="Submissions Processed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Allocations Distribution Ring */}
          <div className="card adb-panel-card-container">
            <h3 className="ta-chart-inner-title">📊 Platform Account Distribution Matrix</h3>
            <div className="ta-chart-canvas-holder">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── 4. LOGGED LIVE TRACKING ACTIVITY FLEX LANES ── */}
        <div className="ta-charts-main-grid-row-2 adb-spaced-row-margin">
          
          {/* New Profiles Onboarding Feed */}
          <div className="card adb-panel-card-container">
            <h3 className="adb-list-panel-title">Newest Registrations</h3>
            <div className="adb-live-stream-ledger-column">
              {data.activity?.new_users?.map((u, i) => (
                <div key={i} className="adb-stream-item-row">
                  <div className="adb-avatar-circle-prefix">{u.username?.[0]?.toUpperCase() || 'AI'}</div>
                  <div className="adb-stream-meta-text-block">
                    <div className="adb-stream-item-primary-string">{u.username}</div>
                    <div className="adb-stream-item-secondary-subtext">{u.role?.toUpperCase()} Profile Access • Initialized: {u.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluations Processing Feed Queue */}
          <div className="card adb-panel-card-container">
            <h3 className="adb-list-panel-title">Recent Submissions Pipeline</h3>
            <div className="adb-live-stream-ledger-column">
              {(!data.activity?.submissions || data.activity.submissions.length === 0) ? (
                <p className="sa-text-muted italic-text padding-top-small">Pipeline clearing statement: No assignments items logged in current validation queues.</p>
              ) : (
                data.activity.submissions.map((s, i) => (
                  <div key={i} className="adb-stream-item-row padd-left-zero">
                    <div className="adb-stream-meta-text-block">
                      <div className="adb-stream-item-primary-string text-truncate-span">{s.assignment}</div>
                      <div className="adb-stream-item-secondary-subtext">Calculated for user: {s.student} • Parsed: {s.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* ── 5. SYSTEM SUBSYSTEM COMMAND MODULE DECK ── */}
        <h2 className="section-header adb-console-section-title">
            Administrative Infrastructure Console
        </h2>
        
        <div className="adb-console-links-grid-matrix">
            <Link to="/admin/users" className="card adb-console-link-card cal-border-blue-override">
                <div><h3 className="adb-console-card-title">Users Profile Deck</h3><p className="adb-console-card-desc">Privileges, System Role Mapping & Access Security</p></div>
            </Link>

            <Link to="/admin/classes" className="card adb-console-link-card cal-border-pink-override">
                <div><h3 className="adb-console-card-title">Timetable Schedule</h3><p className="adb-console-card-desc">Syllabus Grid Layouts, Clashes & Room Diagnostics</p></div>
            </Link>

            <Link to="/admin/courses" className="card adb-console-link-card cal-border-amber-override">
                <div><h3 className="adb-console-card-title">Attendance Sheets</h3><p className="adb-console-card-desc">Lock Overrides & Finalized Semester Verification Logs</p></div>
            </Link>

            <Link to="/admin/semesters" className="card adb-console-link-card cal-border-orange-override">
                <div><h3 className="adb-console-card-title">Academic Semesters</h3><p className="adb-console-card-desc">Configure Active Calendar Terms Spaces Matrices</p></div>
            </Link>

            <Link to="/admin/announcements" className="card adb-console-link-card cal-border-red-override">
                <div><h3 className="adb-console-card-title">Global Broadcast</h3><p className="adb-console-card-desc">Publish Alphanumeric Announcement Banner Channels</p></div>
            </Link>

            <Link to="/admin/calendar" className="card adb-console-link-card cal-border-purple-override">
                <div><h3 className="adb-console-card-title">Interactive Matrix</h3><p className="adb-console-card-desc">Complete Calendar Weekly Partition Visual Flow</p></div>
            </Link>

            <Link to="/admin/departments" className="card adb-console-link-card cal-border-emerald-override">
                <div><h3 className="adb-console-card-title">Faculty Workgroups</h3><p className="adb-console-card-desc">Programs Classification Core, Branches & Structures</p></div>
            </Link>

            <Link to="/admin/feedback" className="card adb-console-link-card cal-border-yellow-override">
                <div><h3 className="adb-console-card-title">Quality Assurance</h3><p className="adb-console-card-desc">Analyze Student Course Reviews Evaluation Data</p></div>
            </Link>

            <Link to="/admin/reports" className="card adb-console-link-card cal-border-indigo-override">
                <div><h3 className="adb-console-card-title">System Metrics</h3><p className="adb-console-card-desc">Compute Infrastructure Load & RAG Storage Footprints</p></div>
            </Link>
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .sa-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        
        /* Hero Banner System */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 60px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; position: relative; z-index: 2; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; position: relative; z-index: 2; }
        
        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .adb-spaced-row-margin { margin-bottom: 8px; }
        
        /* KPI Cards Grid */
        .sa-stats-grid-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .sa-stat-node-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; }
        .adb-kpi-hover-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.04); }
        .sav-stat-node-label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .sa-stat-integer-value { font-size: 2.2rem; font-weight: 900; line-height: 1; }
        .m-top-6 { margin-top: 8px; }
        
        .box-accent-border-blue { border-top: 4px solid #3b82f6; }
        .box-accent-border-emerald { border-top: 4px solid #10b981; }
        .box-accent-border-amber { border-top: 4px solid #f59e0b; }
        .box-accent-border-red { border-top: 4px solid #ef4444; }
        
        .text-color-blue { color: #2563eb; }
        .text-color-emerald { color: #059669; }
        .text-color-amber { color: #d97706; }
        .text-color-red { color: #dc2626; }

        /* Recharts Graphics Panel Matrices */
        .ta-charts-main-grid-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        .adb-panel-card-container { padding: 24px; }
        .ta-chart-inner-title { margin: 0 0 20px 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
        .ta-chart-canvas-holder { width: 100%; height: 300px; }
        
        /* Live Ledger Columns Lists */
        .adb-list-panel-title { margin: 0 0 16px 0; font-size: 1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .adb-live-stream-ledger-column { display: flex; flex-direction: column; gap: 12px; max-height: 250px; overflow-y: auto; padding-right: 4px; }
        .adb-stream-item-row { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
        .adb-stream-item-row:last-child { border-bottom: none; }
        .padd-left-zero { padding-left: 0; }
        
        .adb-avatar-circle-prefix { width: 36px; height: 36px; border-radius: 50%; background-color: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .adb-stream-meta-text-block { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .adb-stream-item-primary-string { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
        .text-truncate-span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .adb-stream-item-secondary-subtext { font-size: 0.75rem; font-weight: 500; color: #64748b; }
        .sa-text-muted { color: #94a3b8; }
        .italic-text { font-style: italic; }
        .padding-top-small { padding-top: 10px; font-size: 0.85rem; }
        
        /* Administrative Interactive Systems Grid */
        .adb-console-section-title { font-size: 1.3rem; font-weight: 900; color: #0f172a; margin: 10px 0 0 0; }
        .adb-console-links-grid-matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .adb-console-link-card { padding: 24px; text-decoration: none; display: flex; flex-direction: column; justify-content: center; transition: all 0.2s; background: #ffffff; }
        .adb-console-link-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .adb-console-card-title { margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 800; color: #0f172a; }
        .adb-console-card-desc { margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4; }
        
        /* Dynamic Theme Border Highlights */
        .cal-border-blue-override { border-left: 4px solid #3b82f6; }
        .cal-border-pink-override { border-left: 4px solid #ec4899; }
        .cal-border-amber-override { border-left: 4px solid #f59e0b; }
        .cal-border-orange-override { border-left: 4px solid #f97316; }
        .cal-border-red-override { border-left: 4px solid #ef4444; }
        .cal-border-purple-override { border-left: 4px solid #a855f7; }
        .cal-border-emerald-override { border-left: 4px solid #10b981; }
        .cal-border-yellow-override { border-left: 4px solid #eab308; }
        .cal-border-indigo-override { border-left: 4px solid #6366f1; }
        
        /* Scrollbar aesthetics for ledger columns */
        .adb-live-stream-ledger-column::-webkit-scrollbar { width: 4px; }
        .adb-live-stream-ledger-column::-webkit-scrollbar-track { background: transparent; }
        .adb-live-stream-ledger-column::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        @media (max-width: 900px) {
          .ta-charts-main-grid-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

const KPICard = ({ title, value, variant }) => (
  <div className={`sa-stat-node-box box-accent-border-${variant} adb-kpi-hover-card`}>
    <div className="sav-stat-node-label">{title}</div>
    <div className={`sa-stat-integer-value text-color-${variant} m-top-6`}>{value || 0}</div>
  </div>
);

export default AdminDashboard;