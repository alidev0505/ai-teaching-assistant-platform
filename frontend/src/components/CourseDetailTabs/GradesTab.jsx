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
  );
};

export default GradesTab;