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
      <h2>Loading Platform Dashboard Telemetry...</h2>
    </div>
  );

  if (!data) return (
    <div className="adb-splash-container error-prompt">
      <h2>System Overhaul Warning: Failed to calculate master dataset fields index.</h2>
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
    </div>
  );
};

// ✅ REFACTOR: Structural decoupling offloads volatile inline hover script loops to CSS transitions
const KPICard = ({ title, value, variant }) => (
  <div className={`sa-stat-node-box box-accent-border-${variant} adb-kpi-hover-card`}>
    <div className="sav-stat-node-label">{title}</div>
    <div className={`sa-stat-integer-value text-color-${variant} m-top-6`}>{value || 0}</div>
  </div>
);

export default AdminDashboard;