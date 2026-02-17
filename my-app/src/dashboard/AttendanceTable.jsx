import React, { useState, useEffect } from 'react';
import './AttendanceTable.css';

function AttendanceTable({ userId, date, startDate, endDate, showEmployee = false }) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [userId, date, startDate, endDate]);

  async function loadAttendance() {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (userId) params.userId = userId;
      if (date) params.date = date;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await window.electron.getAttendance(params);

      if (result.success) {
        setAttendance(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString) {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(seconds) {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  function formatDate(dateString) {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="attendance-loading">
        <div className="spinner"></div>
        <p>Loading attendance...</p>
      </div>
    );
  }

  if (error) {
    return <div className="attendance-error">{error}</div>;
  }

  if (attendance.length === 0) {
    return (
      <div className="attendance-empty">
        <p>📅 No attendance records found for the selected period.</p>
      </div>
    );
  }

  const totalStats = {
    days: attendance.length,
    totalSeconds: attendance.reduce((sum, r) => sum + r.totalWorkSeconds, 0),
    totalSessions: attendance.reduce((sum, r) => sum + r.sessionsCount, 0),
    avgSeconds: Math.floor(
      attendance.reduce((sum, r) => sum + r.totalWorkSeconds, 0) / attendance.length
    )
  };

  return (
    <div className="attendance-table-container">
      <h2 className="attendance-title">📅 Attendance Records</h2>
      
      <div className="attendance-table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              {showEmployee && <th>Employee</th>}
              <th>First Login</th>
              <th>Last Logout</th>
              <th>Total Work Time</th>
              <th>Sessions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record) => (
              <tr key={record._id}>
                <td>
                  <strong>{formatDate(record.date)}</strong>
                </td>
                {showEmployee && (
                  <td>
                    <div className="employee-cell">
                      <div className="employee-name">{record.userId?.name}</div>
                      <div className="employee-username">@{record.userId?.username}</div>
                    </div>
                  </td>
                )}
                <td>
                  <span className="time-badge time-in">
                    🟢 {formatTime(record.firstSessionStart)}
                  </span>
                </td>
                <td>
                  {record.lastSessionEnd ? (
                    <span className="time-badge time-out">
                      🔴 {formatTime(record.lastSessionEnd)}
                    </span>
                  ) : (
                    <span className="time-badge time-active">
                      ⏺️ Active
                    </span>
                  )}
                </td>
                <td>
                  <strong className="duration-text">
                    {formatDuration(record.totalWorkSeconds)}
                  </strong>
                </td>
                <td>
                  <span className="sessions-badge">
                    {record.sessionsCount}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${record.status}`}>
                    {record.status === 'active' ? '🟢 Active' : '✅ Completed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="attendance-summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-card summary-blue">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <div className="summary-value">{totalStats.days}</div>
              <div className="summary-label">Total Days</div>
            </div>
          </div>

          <div className="summary-card summary-purple">
            <div className="summary-icon">⏱️</div>
            <div className="summary-content">
              <div className="summary-value">{formatDuration(totalStats.totalSeconds)}</div>
              <div className="summary-label">Total Work Time</div>
            </div>
          </div>

          <div className="summary-card summary-green">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <div className="summary-value">{totalStats.totalSessions}</div>
              <div className="summary-label">Total Sessions</div>
            </div>
          </div>

          <div className="summary-card summary-orange">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <div className="summary-value">{formatDuration(totalStats.avgSeconds)}</div>
              <div className="summary-label">Avg. Work Time/Day</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceTable;