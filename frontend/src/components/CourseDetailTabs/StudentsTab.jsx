import React, { useState } from 'react';

const StudentsTab = ({ students = [], id, removeStudent, fetchStudents }) => {
  const [error, setError] = useState('');

  const handleRemove = async (studentId, studentName) => {
    setError('');
    if (window.confirm(`Are you sure you want to remove ${studentName || 'this student'} from this course?`)) {
      try {
        await removeStudent(id, studentId);
        fetchStudents();
      } catch (err) {
        console.error(err);
        setError("Privilege Error: Failed to remove the requested student record safely.");
      }
    }
  };

  return (
    <div className="st-table-wrapper">
      {error && <div className="st-banner-error">⚠️ {error}</div>}
      
      <div className="st-responsive-table-scroll">
        <table className="st-table">
          <thead className="st-thead">
            <tr>
              <th className="st-th st-text-left">Student Name</th>
              <th className="st-th st-text-left">Email Address</th>
              <th className="st-th st-text-right">Action</th>
            </tr>
          </thead>
          <tbody className="st-tbody">
            {students.length === 0 ? (
              <tr>
                <td colSpan="3" className="st-td st-empty-state">
                  No students are currently enrolled in this course roster.
                </td>
              </tr>
            ) : (
              students.map(s => (
                <tr key={s.id} className="st-tr">
                  <td className="st-td gt-item-title">{s.username || 'Unverified Student'}</td>
                  <td className="st-td st-text-muted">{s.email || 'No email attached'}</td>
                  <td className="st-td st-text-right">
                    <button 
                      onClick={() => handleRemove(s.id, s.username)} 
                      className="st-btn-remove"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .st-table-wrapper {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          animation: st-fadeIn 0.2s ease-out;
        }

        .st-banner-error {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          background-color: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          margin-bottom: 16px;
          text-align: left;
        }

        /* Responsive Table Container Matrix */
        .st-responsive-table-scroll {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
          background-color: #ffffff;
        }

        .st-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .st-table th {
          background-color: #f8fafc;
          padding: 14px 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e2e8f0;
        }

        .st-tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
        }

        .st-tr:last-child {
          border-bottom: none;
        }

        .st-tr:hover {
          background-color: #f8fafc;
        }

        .st-td {
          padding: 14px 20px;
          font-size: 0.925rem;
          color: #334155;
          vertical-align: middle;
        }

        .gt-item-title {
          font-weight: 700;
          color: #0f172a;
        }

        .st-text-muted {
          color: #64748b;
          font-weight: 500;
        }

        .st-text-left { text-align: left; }
        .st-text-right { text-align: right; }

        /* Actions Destructive Triggers Controls */
        .st-btn-remove {
          background-color: #ffffff;
          color: #dc2626;
          border: 1px solid #fecaca;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.825rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .st-btn-remove:hover {
          background-color: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
        }

        /* Empty Roster State Layout Fallback */
        .st-empty-state {
          padding: 60px 24px !important;
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.9rem;
          background-color: #ffffff;
        }

        @keyframes st-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Smartphone Dynamic Scalers Adjustments */
        @media (max-width: 640px) {
          .st-table th, .st-td {
            padding: 12px 14px;
            font-size: 0.85rem;
          }
          .st-btn-remove {
            padding: 5px 10px;
            font-size: 0.775rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentsTab;