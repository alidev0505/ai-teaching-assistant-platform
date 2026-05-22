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
    const records = Object.entries(attendanceMap).map(([sid, status]) => ({
      student_id: parseInt(sid), status: status
    }));
    
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
            className 📝 Mark Session Roster
          </button>
          <button onClick={() => { setSystemAlert({ type: '', text: '' }); setActiveTab('report'); }} className={`amt-tab-btn ${activeTab === 'report' ? 'active-tab-state' : ''}`}>
            📊 Interactive Reports
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
                <button onClick={saveAttendance} disabled={submitting} className="btn-save">
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
    </div>
  );
};

export default Attendance;