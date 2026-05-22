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
    </div>
  );
};

export default AdminReports;