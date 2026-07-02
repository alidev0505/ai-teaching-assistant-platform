import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { getAttendanceReport } from '../services/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-teaching-backend-bcefdeexdfg4decz.westeurope-01.azurewebsites.net';

const Attendance = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('mark');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState(1);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });

  useEffect(() => { 
    fetchCourseDetails(); 
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'report') fetchReport();
  }, [activeTab]);

  const fetchCourseDetails = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/content/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data?.students || []);
        setIsLocked(data?.course?.is_attendance_locked || false);
        const initialMap = {};
        if (data?.students) data.students.forEach(s => initialMap[s.id] = null);
        setAttendanceMap(initialMap);
      }
    } catch (err) { 
      console.error("Failed to fetch course details for roll tracking.", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchReport = async () => {
    try {
      const res = await getAttendanceReport(courseId);
      setReportData({
        pie: res?.data?.pie || [],
        trend: res?.data?.trend || [],
        at_risk: res?.data?.at_risk || []
      });
    } catch (err) { 
      console.error("Failed to load historical analytics report data.", err); 
    }
  };

  const markAllPresent = () => {
    if (isLocked) return;
    const newMap = {};
    students.forEach(s => newMap[s.id] = 'Present');
    setAttendanceMap(newMap);
  };

  const toggleStatus = (studentId) => {
    if (isLocked) return;
    setAttendanceMap(prev => {
      const current = prev[studentId];
      let nextStatus = 'Present';
      if (current === 'Present') nextStatus = 'Absent';
      else if (current === 'Absent') nextStatus = 'Late';
      else if (current === 'Late') nextStatus = 'Present';
      return { ...prev, [studentId]: nextStatus };
    });
  };

  const saveAttendance = async () => {
    setSystemAlert({ type: '', text: '' });
    const pending = students.filter(s => !attendanceMap[s.id]);
    
    if (pending.length > 0) {
      return setSystemAlert({ type: 'error', text: `Incomplete Roster: Please mark attendance status conditions for all students.` });
    }
    
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const records = dataToUpload();
    
    try {
      const res = await fetch(`${API_URL}/api/content/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId, date: date, session_number: Number(session), records: records })
      });
      if (res.ok) {
        setSystemAlert({ type: 'success', text: 'Attendance ledger metrics saved successfully!' });
      } else {
        setSystemAlert({ type: 'error', text: 'Failed to write session modifications data.' });
      }
    } catch (err) { 
      setSystemAlert({ type: 'error', text: 'Server Link Error: Unable to process structural requests.' });
    } finally {
      setSubmitting(false); 
    }
  };

  const dataToUpload = () => {
    return Object.entries(attendanceMap).map(([sid, status]) => ({
      student_id: parseInt(sid), status: status
    }));
  };

  const lockAttendance = async () => {
    if (!window.confirm("FINAL REFACTOR WARNING: Sheet operations cannot be altered after executing a system lock. Confirm?")) return;
    setSystemAlert({ type: '', text: '' });
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/content/attendance/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId })
      });
      if (res.ok) { 
        setIsLocked(true); 
        setSystemAlert({ type: 'success', text: '🔒 Attendance record parameters successfully locked into immutable states.' });
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const getBadgeClass = (status) => {
    if (status === 'Present') return 'status-present';
    if (status === 'Absent') return 'status-absent';
    if (status === 'Late') return 'status-late';
    return 'status-pending';
  };

  const COLORS = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b' };

  return (
    <div className="amt-page-wrapper">
      <Navbar />

      {/* ── 1. HERO BANNER HEADER CONSOLE ── */}
      <div className="amt-hero-banner">
        <div className="amt-grid-mesh" />
        <div className="amt-hero-container">
          <button onClick={() => navigate(-1)} className="amt-btn-back">← Back</button>
          <h1 className="amt-hero-main-title">Attendance Management Hub</h1>
        </div>
      </div>

      <div className="amt-main-content-workspace">
        
        {/* ── 2. TAB TOGGLE NAVIGATION DECK ── */}
        <div className="amt-tab-bar-strip">
          <button onClick={() => { setSystemAlert({ type: '', text: '' }); setActiveTab('mark'); }} className={`amt-tab-btn ${activeTab === 'mark' ? 'active-tab-state' : ''}`}>
             📝 Mark Session Roster
          </button>
          <button onClick={() => { setSystemAlert({ type: '', text: '' }); setActiveTab('report'); }} className={`amt-tab-btn ${activeTab === 'report' ? 'active-tab-state' : ''}`}>
             Interactive Reports
          </button>
        </div>

        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} amt-spaced-banner`}>
            {systemAlert.text}
          </div>
        )}

        {/* --- DYNAMIC TAB VIEW 1: MARK ATTENDANCE MODULUS --- */}
        {activeTab === 'mark' && (
          <div className="amt-tab-display-panel">
            <div className="amt-control-panel-card">
              <div className="amt-panel-header-row">
                <h3 className="amt-panel-inner-title">Session Parameters</h3>
                {isLocked && <span className="amt-lock-tag-badge">LOCKED SHEET</span>}
              </div>
              <div className="amt-panel-form-flex-row">
                <div className="auth-form-group amt-input-adjustment">
                  <label className="amt-input-form-label">Calendar Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isLocked} className="rp-input-field" />
                </div>
                <div className="auth-form-group amt-input-adjustment">
                  <label className="amt-input-form-label">Lecture Session Number</label>
                  <select value={session} onChange={(e) => setSession(e.target.value)} disabled={isLocked} className="rp-input-field select-cursor-pointer">
                    {[...Array(16)].map((_, i) => <option key={i} value={i + 1}>Session {i + 1}</option>)}
                  </select>
                </div>
                {!isLocked && (
                  <button onClick={markAllPresent} className="btn-secondary amt-btn-bulk-action-present">Mark All Present</button>
                )}
              </div>
            </div>

            <div className="table-card amt-table-card-border-fix">
              {loading ? <div className="amt-loader-placeholder-text">Syncing active institutional student registers...</div> : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>University ID Roll</th>
                        <th>Student Name String</th>
                        <th className="amt-th-center-align">Presence Status Trigger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="amt-table-row-node">
                          <td className="id-cell">{student.university_id || 'BAI-N/A'}</td>
                          <td className="name-cell">{student.username}</td>
                          <td className="amt-th-center-align">
                            <button 
                              onClick={() => toggleStatus(student.id)} 
                              className={`status-pill ${getBadgeClass(attendanceMap[student.id])}`}
                              disabled={isLocked}
                            >
                              {attendanceMap[student.id] || 'Pending'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {!isLocked && students.length > 0 && (
              <div className="amt-floating-action-footer-bar">
                <button onClick={lockAttendance} className="amt-btn-lock-sheet">Commit & Lock Sheet</button>
                <button onClick={saveAttendance} disabled={submitting} className="btn-primary">
                  {submitting ? 'Writing Logs...' : 'Save Matrix Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC TAB VIEW 2: COMPOSITE REPORT ANALYTICS --- */}
        {activeTab === 'report' && (
          <div className="amt-tab-display-panel">
            {!reportData ? (
              <div className="amt-loader-placeholder-text">Processing vector statistical configurations...</div>
            ) : (
              <>
                <div className="charts-grid">
                  <div className="chart-card">
                    <h3>📈 Attendance Trend Analysis</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.trend || []}>
                          <defs>
                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="session" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} fill="url(#colorPv)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3>📊 Distribution Ratios</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={reportData.pie || []} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                            {(reportData.pie || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Risk Diagnostic Ledger Tables */}
                <div className="risk-table-card amt-risk-card-restyle">
                  <h3 className="risk-title">⚠️ Student Presence Intervention Analysis</h3>
                  <p className="risk-subtitle">Individuals currently tracing under threshold boundary constraints (75% Attendance).</p>
                  <div className="table-responsive">
                    <table className="ta-master-table">
                      <thead>
                        <tr>
                          <th>Student Name String</th>
                          <th>Percentage Scalar</th>
                          <th>Missed Class Lectures</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.at_risk.map((s, idx) => (
                          <tr key={idx} className="ta-table-row-node">
                            <td className="name-cell">{s.name}</td>
                            <td><span className="risk-pill">{s.percentage}%</span></td>
                            <td className="sa-td-muted-text">{s.missed} Session Logs Missing</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.at_risk.length === 0 && (
                      <div className="good-standing-msg">🎉 Perfect Standing: Roster resides completely within standard operating thresholds.</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .amt-page-wrapper { background: #f8fafc; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
        .amt-hero-banner { background: linear-gradient(150deg, #0c1445 0%, #1e3a8a 45%, #0284c7 100%); padding: 40px 0 100px; position: relative; overflow: hidden; }
        .amt-grid-mesh { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px); background-size: 24px 24px; }
        .amt-hero-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; position: relative; }
        .amt-hero-main-title { margin: 0; font-size: clamp(1.6rem, 5vw, 2.4rem); color: #ffffff; font-weight: 900; letter-spacing: -1px; }
        .amt-btn-back { background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; transition: background 0.2s ease; }
        .amt-btn-back:hover { background: rgba(255, 255, 255, 0.18); }
        .amt-main-content-workspace { max-width: 1280px; margin: -50px auto 0; padding: 0 20px; position: relative; z-index: 10; }

        /* Tab Layout Strips */
        .amt-tab-bar-strip { display: flex; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); margin-bottom: 25px; }
        .amt-tab-btn { flex: 1; padding: 18px 15px; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; font-size: 0.9rem; font-family: inherit; transition: all 0.2s ease; border-bottom: 3px solid transparent; }
        .amt-tab-btn.active-tab-state { background: #eff6ff; color: #1d4ed8; font-weight: 800; border-bottom-color: #1d4ed8; }
        .amt-tab-display-panel { animation: amt-fadeIn 0.2s ease-out; }
        .amt-spaced-banner { margin-bottom: 20px; }

        /* Configuration Cards */
        .amt-control-panel-card { background: #ffffff; padding: 25px; border-radius: 16px; border-left: 6px solid #2563eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); margin-bottom: 25px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; box-sizing: border-box; }
        .amt-panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .amt-panel-inner-title { margin: 0; font-weight: 800; color: #1e293b; font-size: 1.15rem; letter-spacing: -0.3px; }
        .amt-lock-tag-badge { background: #fee2e2; color: #dc2626; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .amt-panel-form-flex-row { display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end; }
        .amt-input-adjustment { flex: 1; min-width: 180px; }
        .amt-input-form-label { display: block; margin-bottom: 8px; font-weight: 700; color: #475569; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .amt-btn-bulk-action-present { height: 44px; padding: 0 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; cursor: pointer; transition: background 0.15s; }
        .amt-btn-bulk-action-present:hover { background: #f8fafc; }

        /* Roster Tables */
        .amt-table-card-border-fix { border-radius: 16px; margin-bottom: 40px; background: #ffffff; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
        .table-responsive { width: 100%; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { padding: 14px 20px; background: #f8fafc; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 0.925rem; color: #334155; vertical-align: middle; }
        .amt-table-row-node:hover td { background: #fdfdfd; }
        .id-cell { font-family: monospace; font-weight: 600; color: #475569; }
        .name-cell { font-weight: 700; color: #0f172a; }
        .amt-th-center-align { text-align: center; }
        .amt-loader-placeholder-text { padding: 80px 24px; text-align: center; color: #64748b; font-weight: 600; font-size: 0.95rem; }

        /* Pill Badges */
        .status-pill { border: none; padding: 6px 16px; border-radius: 50px; font-size: 0.825rem; font-weight: 800; cursor: pointer; display: inline-block; min-width: 90px; text-align: center; transition: transform 0.1s; }
        .status-pill:active:not(:disabled) { transform: scale(0.95); }
        .status-pill:disabled { cursor: not-allowed; opacity: 0.85; }
        .status-present { background: #d1fae5; color: #065f46; }
        .status-absent { background: #fee2e2; color: #991b1b; }
        .status-late { background: #fef3c7; color: #92400e; }
        .status-pending { background: #f1f5f9; color: #475569; }

        /* Floating Footers Console */
        .amt-floating-action-footer-bar { position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 12px 28px; border-radius: 100px; border: 1px solid #cbd5e1; display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); z-index: 1000; animation: amt-slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .amt-btn-lock-sheet { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 10px 22px; border-radius: 50px; font-weight: 700; cursor: pointer; font-size: 0.875rem; transition: background 0.2s ease; }
        .amt-btn-lock-sheet:hover { background: #fee2e2; }
        .btn-primary { background: #2563eb; color: #ffffff; border: none; padding: 10px 24px; border-radius: 50px; font-weight: 700; cursor: pointer; font-size: 0.875rem; box-shadow: 0 4px 10px rgba(37,99,235,0.2); transition: background 0.2s; }
        .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
        .btn-primary:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; box-shadow: none; }

        /* Analytics View Layouts */
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; margin-bottom: 30px; }
        .chart-card { background: #ffffff; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01); }
        .chart-card h3 { margin: 0 0 20px 0; color: #334155; font-size: 1.1rem; font-weight: 800; }
        .chart-wrapper { width: 100%; height: 300px; }

        .amt-risk-card-restyle { border-top: 6px solid #ef4444 !important; background: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px; }
        .risk-title { color: #991b1b; margin: 0; font-weight: 800; font-size: 1.2rem; }
        .risk-subtitle { font-size: 0.9rem; color: #64748b; margin-top: 5px; margin-bottom: 25px; }
        .risk-pill { background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; border: 1px solid #fca5a5; }
        .sa-td-muted-text { color: #64748b; font-weight: 600; font-size: 0.875rem; }
        .good-standing-msg { padding: 20px; background: #ecfdf5; color: #065f46; border-radius: 12px; text-align: center; border: 1px solid #a7f3d0; font-weight: 600; margin-top: 10px; }

        /* Standard Alert Notifications */
        .auth-alert { padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; }
        .auth-alert.error { background-color: #fef2f2; color: #b91c1c; border: 1px solid #fca5a5; }
        .auth-alert.success { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        
        /* Form Inputs standard setup utilities */
        .auth-form-group { display: flex; flex-direction: column; gap: 6px; }
        .rp-input-field { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; color: #0f172a; background-color: #ffffff; outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s; height: 42px; }
        .rp-input-field:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .select-cursor-pointer { cursor: pointer; }

        @keyframes amt-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes amt-slideIn { from { transform: translate(-50%, 15px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

        /* Mobile Device Breakpoint shifters Adaptations */
        @media (max-width: 768px) {
          .amt-panel-form-flex-row { flex-direction: column; align-items: stretch; }
          .amt-btn-bulk-action-present { width: 100%; }
          .amt-hero-banner { text-align: center; padding-bottom: 80px; }
          .amt-main-content-workspace { margin-top: -40px; }
          .amt-floating-action-footer-bar { width: 90%; justify-content: center; border-radius: 16px; bottom: 16px; padding: 10px 16px; }
          .amt-tab-btn { font-size: 0.75rem; padding: 15px 4px; }
          .charts-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;