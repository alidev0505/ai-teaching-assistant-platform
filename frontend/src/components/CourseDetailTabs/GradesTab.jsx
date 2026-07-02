import React from 'react';

const GradesTab = ({ grades = [] }) => {
  const getBadgeClass = (type) => {
    const standardizedType = String(type).trim().toLowerCase();
    return standardizedType === 'quiz' ? 'gt-badge-quiz' : 'gt-badge-assignment';
  };

  const getScoreColorClass = (score, status) => {
    if (status !== 'Graded') return 'gt-score-pending';
    const parsedScore = parseFloat(score);
    return !isNaN(parsedScore) && parsedScore >= 50 ? 'gt-score-pass' : 'gt-score-fail';
  };

  return (
    <div className="gt-table-container">
      <div className="gt-responsive-table-scroll">
        <table className="gt-table">
          <thead className="gt-thead">
            <tr>
              <th className="gt-th gt-text-left">Assessment Item</th>
              <th className="gt-th gt-text-left">Type</th>
              <th className="gt-th gt-text-left">Submission Date</th>
              <th className="gt-th gt-text-right">Score / Status</th>
            </tr>
          </thead>
          <tbody className="gt-tbody">
            {grades.length === 0 ? (
              <tr>
                <td colSpan="4" className="gt-td gt-empty-state">
                  No verified grades or evaluation logs recorded yet.
                </td>
              </tr>
            ) : (
              grades.map((g, idx) => (
                <tr key={g.id || idx} className="gt-tr">
                  <td className="gt-td gt-item-title">{g.title || 'Untitled Assessment'}</td>
                  <td className="gt-td">
                    <span className={`gt-badge ${getBadgeClass(g.type)}`}>
                      {g.type || 'Task'}
                    </span>
                  </td>
                  <td className="gt-td gt-text-muted">{g.date || 'N/A'}</td>
                  <td className="gt-td gt-text-right">
                    <span className={`gt-score-label ${getScoreColorClass(g.score, g.status)}`}>
                      {g.status === 'Graded' ? `✅ ${g.score}/100` : (g.status || 'Pending')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── COMPONENT SELF-CONTAINED EMBEDDED STYLES ── */}
      <style>{`
        .gt-table-container {
          width: 100%;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          box-sizing: border-box;
          animation: gt-fadeIn 0.2s ease-out;
        }

        /* Responsive Table Frame */
        .gt-responsive-table-scroll {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02);
          background-color: #ffffff;
        }

        .gt-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .gt-table th {
          background-color: #f8fafc;
          padding: 14px 20px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #e2e8f0;
        }

        .gt-tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
        }

        .gt-tr:last-child {
          border-bottom: none;
        }

        .gt-tr:hover {
          background-color: #f8fafc;
        }

        .gt-td {
          padding: 14px 20px;
          font-size: 0.925rem;
          color: #334155;
          vertical-align: middle;
        }

        .gt-item-title {
          font-weight: 700;
          color: #0f172a;
        }

        .gt-text-muted {
          color: #64748b;
          font-weight: 500;
        }

        .gt-text-left { text-align: left; }
        .gt-text-right { text-align: right; }

        /* Assessment Categorization Badges */
        .gt-badge {
          display: inline-block;
          font-size: 0.725rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border: 1px solid transparent;
        }

        .gt-badge-quiz {
          background-color: #f5f3ff;
          color: #6d28d9;
          border-color: #ddd6fe;
        }

        .gt-badge-assignment {
          background-color: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        /* Dynamic Score Metrics Allocations */
        .gt-score-label {
          font-size: 0.9rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
        }

        .gt-score-pass {
          background-color: #e6f4ea;
          color: #137333;
        }

        .gt-score-fail {
          background-color: #fce8e6;
          color: #c5221f;
        }

        .gt-score-pending {
          background-color: #f1f5f9;
          color: #475569;
          font-style: italic;
          font-weight: 600;
        }

        /* Empty Roster State Fallback */
        .gt-empty-state {
          padding: 60px 24px !important;
          text-align: center;
          color: #94a3b8;
          font-weight: 500;
          font-size: 0.9rem;
          background-color: #ffffff;
        }

        @keyframes gt-fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Smartphone Screen Viewport Shifters */
        @media (max-width: 640px) {
          .gt-table th, .gt-td {
            padding: 12px 14px;
            font-size: 0.85rem;
          }
          .gt-badge {
            font-size: 0.675rem;
            padding: 3px 8px;
          }
          .gt-score-label {
            font-size: 0.825rem;
            padding: 3px 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default GradesTab;