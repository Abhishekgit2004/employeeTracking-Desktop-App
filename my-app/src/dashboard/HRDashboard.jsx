import React, { useState, useEffect } from 'react';
import './HRDashboard.css';

const HRDashboard = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dashboardData, setDashboardData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSessions, setEmployeeSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching HR dashboard for date:', selectedDate);
      
      const result = await window.electron.getHRDashboard({ date: selectedDate });
      
      console.log('📊 HR Dashboard result:', result);
      
      if (result.success) {
        setDashboardData(result.data);
        console.log(`✅ Loaded ${result.data.length} employees`);
      } else {
        console.error('❌ Failed to fetch dashboard:', result.message);
        setDashboardData([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setDashboardData([]);
      setLoading(false);
    }
  };

  const viewEmployeeDetail = async (employee) => {
    console.log('👤 Viewing details for:', employee.name, '(ID:', employee._id, ')');
    setSelectedEmployee(employee);
    
    // Fetch all sessions for this employee on this date
    try {
      console.log('🔍 Fetching sessions for userId:', employee._id, 'date:', selectedDate);
      
      const result = await window.electron.getSessions({
        userId: employee._id,
        date: selectedDate
      });
      
      console.log('📊 Employee sessions result:', result);
      
      if (result.success) {
        setEmployeeSessions(result.data);
        console.log(`✅ Loaded ${result.data.length} sessions for ${employee.name}`);
      } else {
        console.error('❌ Failed to fetch sessions:', result.message);
        setEmployeeSessions([]);
      }
    } catch (err) {
      console.error('Error fetching employee sessions:', err);
      setEmployeeSessions([]);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppIcon = (appName) => {
    const name = appName.toLowerCase();
    if (name.includes('chrome') || name.includes('edge') || name.includes('firefox') || name.includes('brave')) return '🌐';
    if (name.includes('code') || name.includes('visual studio')) return '💻';
    if (name.includes('slack')) return '💬';
    if (name.includes('excel')) return '📊';
    if (name.includes('word')) return '📝';
    if (name.includes('outlook')) return '📧';
    if (name.includes('teams')) return '👥';
    if (name.includes('zoom')) return '📹';
    if (name.includes('terminal')) return '⌨️';
    return '📱';
  };

  const getProductivityColor = (percentage) => {
    if (percentage >= 70) return '#10b981';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="hr-dashboard-container">
      {/* Header */}
      <header className="hr-dashboard-header">
        <div>
          <h1>HR Dashboard</h1>
          <p className="user-role">Logged in as {user.name} ({user.role})</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Controls */}
      <div className="controls-bar">
        <div className="date-control">
          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              console.log('📅 Date changed to:', e.target.value);
              setSelectedDate(e.target.value);
              setSelectedEmployee(null); // Reset employee selection on date change
            }}
            max={getTodayDate()}
          />
        </div>

        {selectedEmployee && (
          <button onClick={() => setSelectedEmployee(null)} className="back-btn">
            ← Back to Overview
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {/* Overview */}
      {!loading && !selectedEmployee && (
        <div className="overview-section">
          <h2>All Employees - {new Date(selectedDate).toLocaleDateString()}</h2>
          
          {dashboardData.length === 0 ? (
            <div className="no-data">
              <p>No activity found for {new Date(selectedDate).toLocaleDateString()}</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#a1a1aa' }}>
                Try selecting a different date or check if employees have tracked time on this date.
              </p>
            </div>
          ) : (
            <div className="employees-grid">
              {dashboardData.map((item, index) => (
                <div 
                  key={item.employee._id || index} 
                  className="employee-card"
                  onClick={() => viewEmployeeDetail(item.employee)}
                >
                  <div className="employee-header">
                    <div className="employee-avatar">
                      {item.employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{item.employee.name}</h3>
                      <p className="employee-username">@{item.employee.username}</p>
                    </div>
                  </div>

                  <div className="employee-stats">
                    <div className="stat-row">
                      <span className="stat-label">⏱️ Total Time:</span>
                      <span className="stat-value">{formatDuration(item.totalSeconds)}</span>
                    </div>

                    <div className="stat-row">
                      <span className="stat-label">📅 Sessions:</span>
                      <span className="stat-value">{item.sessions.length}</span>
                    </div>

                    <div className="stat-row">
                      <span className="stat-label">📱 Apps Used:</span>
                      <span className="stat-value">
                        {item.totalActivities ? 
                          new Set(item.totalActivities.map(a => a.app)).size : 0}
                      </span>
                    </div>

                    <div className="stat-row">
                      <span className="stat-label">📊 Productivity:</span>
                      <span 
                        className="productivity-badge"
                        style={{ 
                          background: getProductivityColor(item.productivity || 0),
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {item.productivity || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <span className="view-details">View Sessions →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employee Detail View */}
      {!loading && selectedEmployee && (
        <div className="detail-section">
          <div className="detail-header">
            <div className="employee-info-large">
              <div className="employee-avatar-large">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{selectedEmployee.name}</h2>
                <p>@{selectedEmployee.username}</p>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="sessions-detail">
            <h3>All Sessions - {new Date(selectedDate).toLocaleDateString()}</h3>
            
            {employeeSessions.length === 0 ? (
              <div className="no-data">
                <p>No sessions found for this date</p>
              </div>
            ) : (
              <div className="sessions-timeline">
                {employeeSessions.map((session, index) => (
                  <div key={session._id || index} className={`session-detail-card ${session.status}`}>
                    <div className="session-header-detail">
                      <span className="session-number">Session #{employeeSessions.length - index}</span>
                      <span className={`session-status ${session.status}`}>
                        {session.status === 'active' ? '🔴 Active' : '✅ Completed'}
                      </span>
                    </div>

                    <div className="session-time-info">
                      <div className="time-block">
                        <span className="time-label">Start Time</span>
                        <span className="time-value">{formatDateTime(session.startTime)}</span>
                      </div>
                      {session.endTime && (
                        <div className="time-block">
                          <span className="time-label">End Time</span>
                          <span className="time-value">{formatDateTime(session.endTime)}</span>
                        </div>
                      )}
                      <div className="time-block">
                        <span className="time-label">Duration</span>
                        <span className="time-value">{formatDuration(session.durationSeconds)}</span>
                      </div>
                    </div>

                    {/* Activities for this session */}
                    {session.activities && session.activities.length > 0 && (
                      <div className="session-activities">
                        <h4>Activities ({session.activities.length} apps)</h4>
                        <div className="activities-grid">
                          {session.activities
                            .sort((a, b) => b.seconds - a.seconds)
                            .slice(0, 8)
                            .map((activity, idx) => (
                              <div key={idx} className="activity-mini-card">
                                <span className="activity-icon">{getAppIcon(activity.app)}</span>
                                <div className="activity-mini-info">
                                  <span className="activity-name">{activity.app}</span>
                                  <span className="activity-time">{formatDuration(activity.seconds)}</span>
                                  <span className="activity-cat">{activity.category}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                        {session.activities.length > 8 && (
                          <p style={{ 
                            textAlign: 'center', 
                            marginTop: '1rem', 
                            fontSize: '0.875rem',
                            color: '#a1a1aa'
                          }}>
                            + {session.activities.length - 8} more apps
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;