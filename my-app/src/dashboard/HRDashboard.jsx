import React, { useState } from 'react';
import './HRDashboard.css';
import ScreenshotsViewer from './ScreenshotsViewer';
// import AttendanceTable from '../components/AttendanceTable';
import AttendanceTable from './AttendanceTable';

const HRDashboard = ({ user, onLogout }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dashboardData, setDashboardData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSessions, setEmployeeSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'attendance', 'employee-detail', 'employee-attendance'
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  React.useEffect(() => {
    if (activeView === 'overview' && !selectedEmployee) {
      fetchDashboard();
    }
  }, [selectedDate, activeView]);

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
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setDashboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const viewEmployeeDetail = async (employee) => {
    console.log('👤 Viewing details for:', employee.name, '(ID:', employee._id, ')');
    setSelectedEmployee(employee);
    setActiveView('employee-detail');
    setExpandedActivities({});
    
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

  // ✅ NEW: View single employee's attendance history
  const viewEmployeeAttendance = (employee) => {
    console.log('📅 Viewing attendance for:', employee.name);
    setSelectedEmployee(employee);
    setActiveView('employee-attendance');
    setDateRange({ startDate: null, endDate: null }); // Reset date range
  };

  const handleBackToOverview = () => {
    setSelectedEmployee(null);
    setEmployeeSessions([]);
    setActiveView('overview');
    fetchDashboard();
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedEmployee(null);
    setEmployeeSessions([]);
    if (view === 'overview') {
      fetchDashboard();
    }
  };

  const toggleActivityExpansion = (sessionId, activityIndex) => {
    const key = `${sessionId}-${activityIndex}`;
    setExpandedActivities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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

      {/* Navigation Tabs - Only show when NOT viewing employee details */}
      {!selectedEmployee && (
        <div className="hr-tabs">
          <button 
            className={`hr-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => handleViewChange('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`hr-tab ${activeView === 'attendance' ? 'active' : ''}`}
            onClick={() => handleViewChange('attendance')}
          >
            📅 All Attendance Records
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="controls-bar">
        {activeView === 'overview' && !selectedEmployee && (
          <div className="date-control">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                console.log('📅 Date changed to:', e.target.value);
                setSelectedDate(e.target.value);
              }}
              max={getTodayDate()}
            />
          </div>
        )}

        {activeView === 'attendance' && (
          <div className="date-range-control">
            <label>Date Range:</label>
            <input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              placeholder="End Date"
            />
          </div>
        )}

        {/* ✅ NEW: Date range for single employee attendance */}
        {activeView === 'employee-attendance' && selectedEmployee && (
          <div className="date-range-control">
            <label>{selectedEmployee.name}'s Attendance:</label>
            <input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              placeholder="End Date"
            />
          </div>
        )}

        {selectedEmployee && (
          <button onClick={handleBackToOverview} className="back-btn">
            ← Back to Overview
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {/* All Employees Attendance View */}
      {activeView === 'attendance' && !loading && !selectedEmployee && (
        <div className="attendance-view">
          <AttendanceTable
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            showEmployee={true}
          />
        </div>
      )}

      {/* ✅ NEW: Single Employee Attendance View */}
      {activeView === 'employee-attendance' && !loading && selectedEmployee && (
        <div className="attendance-view">
          <div className="employee-attendance-header">
            <div className="employee-info-banner">
              <div className="employee-avatar-large">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{selectedEmployee.name}</h2>
                <p>@{selectedEmployee.username}</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="employee-actions">
              <button 
                className="action-btn secondary"
                onClick={() => viewEmployeeDetail(selectedEmployee)}
              >
                📊 View Sessions
              </button>
            </div>
          </div>

          <AttendanceTable
            userId={selectedEmployee._id}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            showEmployee={false}
          />
        </div>
      )}

      {/* Overview - Employee Grid */}
      {!loading && activeView === 'overview' && !selectedEmployee && (
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

                  {/* ✅ NEW: Action buttons */}
                  <div className="card-actions">
                    <button 
                      className="action-btn primary"
                      onClick={() => viewEmployeeDetail(item.employee)}
                    >
                      📊 Sessions
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={() => viewEmployeeAttendance(item.employee)}
                    >
                      📅 Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employee Detail View (Sessions) */}
      {!loading && activeView === 'employee-detail' && selectedEmployee && (
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
            
            {/* ✅ NEW: Quick action to view attendance */}
            <button 
              className="action-btn secondary"
              onClick={() => viewEmployeeAttendance(selectedEmployee)}
              style={{ marginLeft: 'auto' }}
            >
              📅 View Attendance History
            </button>
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
                            .map((activity, idx) => {
                              const hasWebsites = activity.isBrowser && activity.websites && activity.websites.length > 0;
                              const expansionKey = `${session._id}-${idx}`;
                              const isExpanded = expandedActivities[expansionKey];

                              return (
                                <div key={idx} className="activity-detail-card">
                                  <div 
                                    className="activity-mini-card"
                                    onClick={() => hasWebsites && toggleActivityExpansion(session._id, idx)}
                                    style={{ cursor: hasWebsites ? 'pointer' : 'default' }}
                                  >
                                    <span className="activity-icon">{getAppIcon(activity.app)}</span>
                                    <div className="activity-mini-info">
                                      <span className="activity-name">
                                        {activity.app}
                                        {hasWebsites && (
                                          <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#a1a1aa' }}>
                                            ({activity.websites.length} sites)
                                          </span>
                                        )}
                                      </span>
                                      <span className="activity-time">{formatDuration(activity.seconds)}</span>
                                      <span className="activity-cat">{activity.category}</span>
                                    </div>
                                    {hasWebsites && (
                                      <span className="expand-icon-mini">
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                    )}
                                  </div>

                                  {/* Expandable websites list */}
                                  {hasWebsites && isExpanded && (
                                    <div className="websites-breakdown">
                                      <div className="websites-breakdown-header">Websites visited:</div>
                                      {activity.websites
                                        .sort((a, b) => b.seconds - a.seconds)
                                        .map((website, widx) => (
                                          <div key={widx} className="website-breakdown-item">
                                            <span className="website-breakdown-icon">🔗</span>
                                            <div className="website-breakdown-info">
                                              <span className="website-breakdown-name">{website.site}</span>
                                              <span className="website-breakdown-time">{formatDuration(website.seconds)}</span>
                                            </div>
                                            <span className="website-breakdown-category">{website.category}</span>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Screenshots Section */}
                    <ScreenshotsViewer session={session} />
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