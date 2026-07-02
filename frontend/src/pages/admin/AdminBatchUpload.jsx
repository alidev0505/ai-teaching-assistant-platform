import React, { useState } from 'react';
import { uploadSchedule } from '../../services/api';

const AdminBatchUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [systemAlert, setSystemAlert] = useState({ type: '', text: '' });
  const [report, setReport] = useState({
    courses_created: 0,
    courses_updated: 0,
    created_teachers: [],
    conflicts: [],
    errors: []
  });
  const [showReport, setShowReport] = useState(false);

  const downloadTemplate = () => {
    const headers = 'Course Code,Program,Semester,Shift,Course Name,Credit Hours,Instructor,Day,Time In,Time Out,Room';
    const sampleRow = 'MAT 101,BSDS,I-A,M,Calculus & Analytical Geometry,3:00,Ms. Nazia Sultana,Wednesday,2:00 PM,5:00 PM,IT-401';
    
    const csvContent = [headers, sampleRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Schedule_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCredentialsCSV = (teachers) => {
    if (!teachers || teachers.length === 0) return;

    const headers = 'Teacher Name,Email,Temporary Password';
    const rows = teachers.map(t => `"${t.name?.replace(/"/g, '""')}","${t.email?.replace(/"/g, '""')}","${t.password || ''}"`);
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Teacher_Credentials_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setShowReport(false);
      setSystemAlert({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setSystemAlert({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await uploadSchedule(formData);
      const serverReport = res?.data?.report || {};
      
      setReport({
        courses_created: serverReport.courses_created || 0,
        courses_updated: serverReport.courses_updated || 0,
        created_teachers: serverReport.created_teachers || [],
        conflicts: serverReport.conflicts || [],
        errors: serverReport.errors || []
      });
      
      setShowReport(true);
      setSystemAlert({ type: 'success', text: 'CSV Schedule processing pipeline successfully parsed batch data entries!' });
      
      if (onUploadSuccess) onUploadSuccess();

      if (serverReport.created_teachers && serverReport.created_teachers.length > 0) {
        downloadCredentialsCSV(serverReport.created_teachers);
      }
    } catch (err) {
      console.error(err);
      setSystemAlert({ type: 'error', text: `Batch Upload Disruption: ${err.message || 'Check documentation data structures formatting.'}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="abu-grid-matrix-row-2">
      <div className="card abu-interaction-card">
        <div className="abu-card-header-block">
          <h3 className="abu-card-title">Upload Timetable Schedule</h3>
          <p className="abu-card-subtitle">Batch process course schedules from an administrative checklist</p>
        </div>

        {systemAlert.text && (
          <div className={`auth-alert ${systemAlert.type === 'error' ? 'error' : 'success'} abu-spaced-alert-banner`}>
            {systemAlert.text}
          </div>
        )}

        <div className="abu-dashed-upload-dropzone">
          <input 
            type="file" 
            accept=".csv"
            id="csv-upload"
            onChange={handleFileChange}
            className="display-hidden-input" 
          />
          
          <label htmlFor="csv-upload" className="abu-dropzone-label">
            <span className="abu-dropzone-main-text">
              {file ? file.name : "Click here to Select Timetable CSV File"}
            </span>
            <span className="abu-dropzone-sub-text">
              Supported formatting vector: .csv spreadsheet structures
            </span>
          </label>
        </div>

        <div className="abu-action-button-vertical-stack">
          <button 
            onClick={handleUpload} 
            disabled={loading || !file}
            className="btn-primary abu-btn-upload-submit"
          >
            {loading ? 'Processing Timetable Records...' : 'Start Batch Upload Processing'}
          </button>

          <button 
            onClick={downloadTemplate}
            className="abu-btn-download-template-link"
          >
            Download Blueprint CSV Template
          </button>
        </div>
      </div>

      {showReport ? (
        <div className="card abu-report-display-panel">
          <div className="abu-report-panel-header-row">
            <h3 className="abu-card-title remove-margin-bottom">Upload Metrics Summary</h3>
            <span className="abu-badge-status-success">Pipeline Active</span>
          </div>

          <div className="abu-stats-summary-grid-row-3">
            <div className="abu-stat-box-cell cell-border-blue">
              <div className="abu-stat-box-integer color-blue">{report.courses_created}</div>
              <div className="abu-stat-box-string-label">New Channels Created</div>
            </div>
            <div className="abu-stat-box-cell cell-border-teal">
              <div className="abu-stat-box-integer color-teal">{report.courses_updated}</div>
              <div className="abu-stat-box-string-label">Syllabus Rows Modified</div>
            </div>
            <div className="abu-stat-box-cell cell-border-indigo">
              <div className="abu-stat-box-integer color-indigo">{report.created_teachers.length}</div>
              <div className="abu-stat-box-string-label">New Instructor Signatures</div>
            </div>
          </div>

          {report.created_teachers.length > 0 && (
            <div className="abu-new-accounts-ledger-section">
              <div className="abu-accounts-inner-header-flex">
                <span className="abu-accounts-section-heading">Generated Access Credentials</span>
                <button
                  onClick={() => downloadCredentialsCSV(report.created_teachers)}
                  className="abu-btn-text-download-csv"
                >
                  Download Accounts Copy
                </button>
              </div>
              <div className="abu-scrollable-table-container-box">
                <table className="abu-master-report-table">
                  <tbody>
                    {report.created_teachers.map((t, index) => (
                      <tr key={index} className="abu-report-table-tr-node">
                        <td className="abu-td-primary-string-bold">{t.name}</td>
                        <td className="sa-td-muted-text">{t.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.conflicts && report.conflicts.length > 0 && (
            <div className="auth-alert warning abu-report-alert-box-spaced">
              <strong className="abu-alert-box-bold-heading">Timetable Scheduler Warnings Ignored:</strong>
              <ul className="abu-alert-box-unordered-list">
                {report.conflicts.map((conf, i) => <li key={i}>{conf}</li>)}
              </ul>
            </div>
          )}

          {report.errors && report.errors.length > 0 && (
            <div className="auth-alert error abu-report-alert-box-spaced">
              <strong className="abu-alert-box-bold-heading">Pipeline Evaluation Errors Trapped:</strong>
              <ul className="abu-alert-box-unordered-list">
                {report.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="abu-empty-state-dashed-placeholder">
          <div className="text-center-link">
            <div className="mt-empty-art">📂</div>
            <p className="mt-empty-text-title">RAG Data Analysis Pending</p>
            <p className="mt-empty-text-subtitle">Commit a calendar document spreadsheet data stream file to analyze batch execution data report logs here.</p>
          </div>
        </div>
      )}

      <style>{`
        .abu-grid-matrix-row-2 { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; font-family: 'Inter', system-ui, sans-serif; align-items: start; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .abu-card-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
        .abu-card-subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
        .abu-spaced-alert-banner { margin-bottom: 20px; }
        
        .abu-dashed-upload-dropzone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: border 0.2s; margin-bottom: 24px; }
        .abu-dashed-upload-dropzone:hover { border-color: #4f46e5; }
        .display-hidden-input { display: none; }
        .abu-dropzone-label { display: flex; flex-direction: column; gap: 8px; cursor: pointer; }
        .abu-dropzone-main-text { font-weight: 700; color: #1e293b; }
        .abu-dropzone-sub-text { font-size: 0.8rem; color: #94a3b8; }
        
        .abu-action-button-vertical-stack { display: flex; flex-direction: column; gap: 12px; }
        .abu-btn-upload-submit { width: 100%; padding: 12px; }
        .abu-btn-download-template-link { background: transparent; border: none; color: #4f46e5; font-weight: 700; font-size: 0.85rem; cursor: pointer; text-decoration: underline; }
        
        .abu-report-display-panel { display: flex; flex-direction: column; gap: 20px; }
        .abu-report-panel-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .abu-badge-status-success { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; }
        
        .abu-stats-summary-grid-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .abu-stat-box-cell { border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; text-align: center; }
        .cell-border-blue { border-top: 4px solid #2563eb; }
        .cell-border-teal { border-top: 4px solid #0d9488; }
        .cell-border-indigo { border-top: 4px solid #4f46e5; }
        .abu-stat-box-integer { font-size: 1.5rem; font-weight: 900; }
        .abu-stat-box-string-label { font-size: 0.725rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
        
        .abu-new-accounts-ledger-section { background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .abu-accounts-inner-header-flex { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .abu-accounts-section-heading { font-weight: 800; font-size: 0.85rem; }
        .abu-btn-text-download-csv { background: none; border: none; color: #2563eb; font-weight: 700; font-size: 0.8rem; cursor: pointer; text-decoration: underline; }
        
        .abu-master-report-table { width: 100%; border-collapse: collapse; }
        .abu-report-table-tr-node td { padding: 8px 0; font-size: 0.875rem; }
        .abu-td-primary-string-bold { font-weight: 700; color: #0f172a; }
        
        .abu-report-alert-box-spaced { margin-top: 15px; }
        .abu-alert-box-bold-heading { display: block; margin-bottom: 6px; }
        .abu-alert-box-unordered-list { margin: 0; padding-left: 20px; font-size: 0.85rem; }
        
        .abu-empty-state-dashed-placeholder { padding: 60px; border: 2px dashed #e2e8f0; border-radius: 16px; text-align: center; }
        .mt-empty-art { font-size: 3rem; margin-bottom: 12px; }
        .mt-empty-text-title { font-weight: 800; font-size: 1.1rem; }
        .mt-empty-text-subtitle { color: #64748b; font-size: 0.9rem; }
        
        @media (max-width: 900px) {
          .abu-grid-matrix-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminBatchUpload;