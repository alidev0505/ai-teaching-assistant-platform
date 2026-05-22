import React, { useState } from 'react';

const StudentsTab = ({ students = [], id, removeStudent, fetchStudents }) => {
  const [error, setError] = useState('');

  const handleRemove = async (studentId, studentName) => {
    setError('');
    // Note: window.confirm is perfectly fine for basic confirmation, or it can be handled by an alert modal later.
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
  );
};

export default StudentsTab;