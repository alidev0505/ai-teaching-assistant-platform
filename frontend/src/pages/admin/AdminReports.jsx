import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../../services/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const AdminReports = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getReports();
      const sorted = (res?.data?.reports || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setData(sorted);
    } catch (err) {
      console.error("Critical telemetry logs synchronization error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    setSystemAlert({ type: '', text: '' });
    if (data.length === 0) {
      return setSystemAlert({ type: 'error', text: 'Export Interrupted: No report data logged to compute.' });
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,AI Generations,Active Users\n"
      + data.map(e => `${e.date},${e.generations || 0},${e.users || 0}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "system_usage_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // ─── SAFE KPI INTERPOLATIONS CALCULATIONS ──────────────────────────────────
  const totalGenerations = data.reduce((acc, curr) => acc + (Number(curr.generations) || 0), 0);
  const avgUsers = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (Number(curr.users) || 0), 0) / data.length) : 0;
  const peakDay = data.reduce((max, curr) => ((Number(curr.generations) || 0) > (Number(max.generations) || 0) ? curr : max), { generations: 0, date: 'BAI-N/A' });

  return (
    <div className="ars-page-wrapper">
      
      {/* ── 1. GLOBAL COMMAND HERO BANNER CODES ── */}
      <div className="adm-hero-banner">
        <div className="adm-grid-mesh" />
        <div className="adm-hero-container max-width-wide">
          <div className="ars-hero-alignment-header-row">
            <div className="ars-brand-text-block">
              <button onClick={() => navigate(-1)} className="adm-btn-back">
                ← Back to Dashboard
              </button>
              <h1 className="adm-hero-main-title">System Usage Analytics</h1>
              <p className="adm-hero-subtitle">Monitor RAG pipeline utilization, active platform traffic, and model compilation endpoints.</p>
            </div>
            
            <button onClick={downloadCSV} className="ars-btn-success-export-csv">
              📥 Export Metrics Ledger
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SCORING KPIS MATRIX CARDS DECK ── */}
      <div className="adm-content-workspace max-width-wide">
        
        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} adc-spaced-banner`}>
            {systemAlert.text}
          </div>
        )}

        <div className="sa-stats-grid-row adb-spaced-row-margin">
          <div className="card sa-stat-node-box box-accent-border-purple adb-kpi-hover-card">
            <div className="sav-stat-node-label">Total AI Pipeline Cycles</div>
            <div className="sa-stat-integer-value text-color-purple m-top-6">{totalGenerations}</div>
          </div>

          <div className="card sa-stat-node-box box-accent-border-blue adb-kpi-hover-card">
            <div className="sav-stat-node-label">Avg. Daily Concurrent Logins</div>
            <div className="sa-stat-integer-value text-color-blue m-top-6">{avgUsers}</div>
          </div>

          <div className="card sa-stat-node-box box-accent-border-amber adb-kpi-hover-card">
            <div className="sav-stat-node-label">Peak Usage Footprint</div>
            <div className="sa-stat-integer-value text-color-amber m-top-6">{peakDay.generations}</div>
            <div className="sav-stat-node-subtext m-top-6">Calculated limit: {peakDay.date}</div>
          </div>
        </div>

        {/* ── 3. VISUAL DISTRIBUTION CHARTS MATRIX PANEL ── */}
        <div className="card adb-panel-card-container adb-spaced-row-margin">
          <h3 className="ta-chart-inner-title">📈 Vector Content Generation Trends</h3>
          
          <div className="ars-chart-canvas-box-rail">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1.5 }}
                  />
                  <Area type="monotone" dataKey="generations" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGen)" strokeWidth={3} name="Generations Out" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="std-chart-empty-placeholder">📊 Processing infrastructure stats: No operational usage metrics logged yet.</div>
            )}
          </div>
        </div>

        {/* ── 4. ITEMIZED DETAILED HISTORICAL LEDGER DATA TABLE ── */}
        <div className="card adc-table-container-card">
          <div className="qd-panel-inner-header-banner">
            <h3 className="qd-visual-panel-title remove-margin-bottom">Detailed Transmission Logs</h3>
          </div>
          
          <div className="adc-responsive-table-scroll-wrapper">
            <table className="adc-master-schedule-table">
              <thead>
                <tr>
                  <th>Log Processing Date</th>
                  <th>Alphanumeric AI Generative Inferences</th>
                  <th>Active Concurrent Sessions</th>
                  <th className="adc-text-right">Database Verification</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="4" className="adc-table-empty-fallback-text">Synchronizing repository traffic metrics sheets...</td></tr>
                ) : data.length === 0 ? (
                   <tr><td colSpan="4" className="adc-table-empty-fallback-text">No analytical traffic records reported inside current timeframe windows.</td></tr>
                ) : (
                  data.map((row, idx) => (
                    <tr key={idx} className="adc-table-tr-node">
                      <td className="font-bold adc-course-main-string-title">{row.date}</td>
                      <td className="text-color-purple font-weight-800">{row.generations || 0} generations</td>
                      <td className="adc-td-instructor-text-cell">{row.users || 0} active nodes</td>
                      <td className="adc-text-right">
                        <span className="padding-badge-override ab-banner ab-type-info font-weight-800">
                          LOGGED OK
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED DESIGN MATRIX ── */}
      <style>{`
        .ars-page-wrapper { min-height: 100vh; background-color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; padding-bottom: 60px; }
        .max-width-wide { max-width: 1400px; margin: 0 auto; padding: 0 24px; box-sizing: border-box; }
        
        /* Fixed Hero Banner Elements */
        .adm-hero-banner { background: linear-gradient(150deg, #1e293b 0%, #0f172a 100%); padding: 40px 0 100px; position: relative; overflow: hidden; margin-bottom: -50px; }
        .adm-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 28px 28px; }
        
        .ars-hero-alignment-header-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; position: relative; z-index: 2; }
        .ars-brand-text-block { display: flex; flex-direction: column; align-items: flex-start; }
        
        .adm-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; margin-bottom: 20px; font-family: inherit; }
        .adm-btn-back:hover { background: rgba(255, 255, 255, 0.2); }
        .adm-hero-main-title { font-size: 2.2rem; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -1px; }
        .adm-hero-subtitle { color: #94a3b8; font-size: 1rem; margin-top: 8px; max-width: 700px; }

        .ars-btn-success-export-csv { background: #10b981; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); white-space: nowrap; font-family: inherit; }
        .ars-btn-success-export-csv:hover { background: #059669; }
        
        .adm-content-workspace { position: relative; z-index: 10; display: flex; flex-direction: column; gap: 24px; }
        .adb-spaced-row-margin { margin-bottom: 8px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }

        /* KPI Scoring Metrics Deck */
        .sa-stats-grid-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .sa-stat-node-box { padding: 24px; transition: transform 0.2s, box-shadow 0.2s; }
        .adb-kpi-hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.04); }
        
        .sav-stat-node-label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .sa-stat-integer-value { font-size: 2.2rem; font-weight: 900; line-height: 1; }
        .sav-stat-node-subtext { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
        .m-top-6 { margin-top: 8px; }
        
        .box-accent-border-purple { border-top: 4px solid #a855f7; }
        .box-accent-border-blue { border-top: 4px solid #3b82f6; }
        .box-accent-border-amber { border-top: 4px solid #f59e0b; }
        
        .text-color-purple { color: #8b5cf6; }
        .text-color-blue { color: #2563eb; }
        .text-color-amber { color: #d97706; }

        /* Chart Components Module */
        .adb-panel-card-container { padding: 24px; }
        .ta-chart-inner-title { margin: 0 0 20px 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .ars-chart-canvas-box-rail { width: 100%; height: 320px; }
        .std-chart-empty-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 500; font-size: 0.95rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; }

        /* Ledger Table Module */
        .adc-table-container-card { padding: 0 !important; }
        .qd-panel-inner-header-banner { padding: 20px 24px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .qd-visual-panel-title { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; }
        
        .adc-responsive-table-scroll-wrapper { width: 100%; overflow-x: auto; }
        .adc-master-schedule-table { width: 100%; border-collapse: collapse; text-align: left; }
        .adc-master-schedule-table th { padding: 16px 24px; background-color: #f8fafc; font-size: 0.75rem; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap; }
        .adc-master-schedule-table td { vertical-align: middle; padding: 16px 24px; border-bottom: 1px solid #f1f5f9; }
        .adc-table-tr-node:hover { background-color: #f8fafc; transition: background-color 0.15s; }
        .adc-table-tr-node:last-child td { border-bottom: none; }
        
        .adc-course-main-string-title { color: #0f172a; font-weight: 800; font-size: 0.95rem; }
        .adc-td-instructor-text-cell { font-weight: 600; color: #475569; font-size: 0.9rem; }
        .adc-text-right { text-align: right; }
        .font-weight-800 { font-weight: 800; }
        
        /* Inline Status Tags */
        .ab-banner { display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; }
        .ab-type-info { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .padding-badge-override { padding: 4px 10px; font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.05em; }

        .adc-table-empty-fallback-text { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 500; font-size: 0.95rem; }

        /* System Alert Feedback Panels */
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; box-sizing: border-box; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .adc-spaced-banner { margin-bottom: 0px; }

        /* Responsive Mobile Triggers */
        @media (max-width: 640px) {
          .ars-hero-alignment-header-row { flex-direction: column; align-items: stretch; }
          .ars-btn-success-export-csv { width: 100%; text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default AdminReports;