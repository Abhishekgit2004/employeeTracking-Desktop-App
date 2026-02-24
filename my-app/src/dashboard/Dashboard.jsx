import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import ActivityCard from './ActivityCard';
import ScreenshotsViewer from './ScreenshotsViewer';
// import ScreenshotManager from '../components/ScreenshotManager'; // ✅ Import
import ScreenshotManager from './ScreenshotManager';

const Dashboard = ({ user, onLogout }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [todayActivity, setTodayActivity] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', or 'screenshots'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Get today's date in YYYY-MM-DD format
  const today = () => new Date().toISOString().split('T')[0];

  // Check tracking status on mount
  useEffect(() => {
    checkTrackingStatus();
    fetchTodayData();
  }, []);

  // Check for incomplete session on mount
  useEffect(() => {
    checkForIncompleteSession();
  }, []);

  // Auto-refresh data every 30 seconds while tracking
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(fetchTodayData, 30000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  // Fetch attendance when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchAttendanceHistory();
    }
  }, [activeTab, dateRange]);

  const checkTrackingStatus = async () => {
    try {
      const status = await window.electron.getSessionStatus();
      console.log('📊 Session status:', status);
      
      setIsTracking(status.active);
      if (status.active && status.sessionId) {
        setCurrentSessionId(status.sessionId);
        setSessionStartTime(status.startTime);
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const checkForIncompleteSession = async () => {
    try {
      const status = await window.electron.getSessionStatus();
      
      if (status.hasIncompleteSession && !status.active) {
        const shouldResume = window.confirm(
          `You have an incomplete session from ${formatTime(status.startTime)}. Would you like to resume tracking?`
        );
        
        if (shouldResume) {
          await handleResumeSession(status.sessionId);
        }
      }
    } catch (err) {
      console.error('Error checking incomplete session:', err);
    }
  };

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      
      const sessionsResult = await window.electron.getSessions({
        userId: user._id,
        date: today()
      });

      if (sessionsResult.success && sessionsResult.data.length > 0) {
        setTodaySessions(sessionsResult.data);
        
        const allActivities = {};
        sessionsResult.data.forEach(session => {
          if (session.activities && session.activities.length > 0) {
            session.activities.forEach(act => {
              const key = act.app;
              if (!allActivities[key]) {
                allActivities[key] = {
                  app: act.app,
                  site: act.site,
                  seconds: 0,
                  clicks: 0,
                  category: act.category,
                  isBrowser: act.isBrowser || false,
                  websites: []
                };
              }
              allActivities[key].seconds += act.seconds || 0;
              allActivities[key].clicks += act.clicks || 0;
              
              if (act.isBrowser && act.websites) {
                act.websites.forEach(website => {
                  const existingWebsite = allActivities[key].websites.find(w => w.site === website.site);
                  if (existingWebsite) {
                    existingWebsite.seconds += website.seconds || 0;
                    existingWebsite.clicks += website.clicks || 0;
                  } else {
                    allActivities[key].websites.push({ ...website });
                  }
                });
              }
            });
          }
        });
        
        setTodayActivity(Object.values(allActivities));
      } else {
        setTodaySessions([]);
        setTodayActivity([]);
      }

      if (isTracking) {
        const liveData = await window.electron.getCurrentActivity();
        if (liveData.success && liveData.activities && liveData.activities.length > 0) {
          const mergedActivities = {};
          
          todayActivity.forEach(act => {
            mergedActivities[act.app] = { ...act };
          });
          
          liveData.activities.forEach(act => {
            const key = act.app;
            if (!mergedActivities[key]) {
              mergedActivities[key] = {
                app: act.app,
                site: act.site,
                seconds: 0,
                clicks: 0,
                category: act.category,
                isBrowser: act.isBrowser || false,
                websites: []
              };
            }
            mergedActivities[key].seconds = act.seconds || 0;
            mergedActivities[key].clicks = act.clicks || 0;
            
            if (act.isBrowser && act.websites) {
              mergedActivities[key].websites = act.websites;
            }
          });
          
          setTodayActivity(Object.values(mergedActivities));
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const params = {
        userId: user._id
      };

      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const result = await window.electron.getAttendance(params);
      
      if (result.success) {
        setAttendanceHistory(result.data || []);
      } else {
        setAttendanceHistory([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceHistory([]);
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      const result = await window.electron.startSession();
      
      if (result.success) {
        setIsTracking(true);
        setCurrentSessionId(result.sessionId);
        setSessionStartTime(result.startTime);
        
        console.log('✅ Tracking started!');
        await fetchTodayData();
      } else {
        alert(result.message || 'Failed to start tracking');
      }
    } catch (err) {
      console.error('Error starting work:', err);
      alert('Failed to start tracking');
    }
  };

  const handleResumeSession = async (sessionId) => {
    try {
      const result = await window.electron.resumeSession({ sessionId });
      
      if (result.success) {
        setIsTracking(true);
        setCurrentSessionId(result.sessionId);
        setSessionStartTime(result.startTime);
        
        console.log('✅ Session resumed!');
        await fetchTodayData();
      } else {
        alert(result.message || 'Failed to resume session');
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      alert('Failed to resume session');
    }
  };

  const handleStopWork = async () => {
    try {
      const confirm = window.confirm(
        'Are you sure you want to stop tracking? This will end your current session.'
      );
      
      if (!confirm) return;
      
      const result = await window.electron.stopSession();
      
      if (result.success) {
        setIsTracking(false);
        setCurrentSessionId(null);
        setSessionStartTime(null);
        
        console.log('✅ Tracking stopped and data saved!');
        await fetchTodayData();
      } else {
        alert(result.message || 'Failed to stop tracking');
      }
    } catch (err) {
      console.error('Error stopping work:', err);
      alert('Failed to stop tracking');
    }
  };

  const handleLogoutClick = async () => {
    if (isTracking) {
      const confirm = window.confirm(
        'You are currently tracking time. Logging out will stop tracking. Continue?'
      );
      
      if (!confirm) return;
      await handleStopWork();
    }
    
    onLogout();
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateTotalSeconds = () => {
    return todaySessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0);
  };

  const calculateProductivity = () => {
    const total = todayActivity.reduce((sum, act) => sum + (act.seconds || 0), 0);
    if (total === 0) return 0;

    const productiveCategories = ['Development', 'Design', 'Communication', 'Documentation'];
    const productiveSeconds = todayActivity
      .filter(act => productiveCategories.includes(act.category))
      .reduce((sum, act) => sum + (act.seconds || 0), 0);

    return Math.round((productiveSeconds / total) * 100);
  };

  const getFirstSession = () => {
    if (todaySessions.length === 0) return null;
    return todaySessions.reduce((earliest, session) => {
      return new Date(session.startTime) < new Date(earliest.startTime) ? session : earliest;
    });
  };

  const getLastSession = () => {
    if (todaySessions.length === 0) return null;
    return todaySessions.reduce((latest, session) => {
      if (!session.endTime) return latest;
      return new Date(session.endTime) > new Date(latest.endTime || 0) ? session : latest;
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {user.name}!</h1>
          <p className="user-role">{user.role}</p>
        </div>
        <button onClick={handleLogoutClick} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Tracking Control */}
      <section className="tracking-control">
        {!isTracking ? (
          <button onClick={handleStartWork} className="start-work-btn">
            ▶️ Start Work
          </button>
        ) : (
          <div className="tracking-active">
            <div className="tracking-indicator">
              <span className="pulse"></span>
              <span>Tracking Active</span>
            </div>
            <p className="tracking-time">Started at {formatTime(sessionStartTime)}</p>
            <button onClick={handleStopWork} className="stop-work-btn">
              ⏹️ Stop Work
            </button>
          </div>
        )}
      </section>

      {/* ✅ UPDATED: 3 Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'today' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          📊 Today's Activity
        </button>
        <button 
          className={`tab ${activeTab === 'screenshots' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('screenshots')}
        >
          📸 My Screenshots
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📅 Attendance History
        </button>
      </div>

      {/* TODAY TAB */}
      {activeTab === 'today' && (
        <>
          {/* Today's Stats Summary */}
          <section className="stats-summary">
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <h3>{formatDuration(calculateTotalSeconds())}</h3>
                <p>Total Work Time Today</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📱</div>
              <div className="stat-info">
                <h3>{todayActivity.length}</h3>
                <p>Apps Used Today</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{calculateProductivity()}%</h3>
                <p>Productivity Score</p>
              </div>
            </div>
          </section>

          {/* App Usage Today */}
          <section className="app-usage-section">
            <h2>Today's App Usage</h2>
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : todayActivity.length > 0 ? (
              <div className="app-usage-grid">
                {todayActivity
                  .sort((a, b) => b.seconds - a.seconds)
                  .slice(0, 8)
                  .map((app, index) => (
                    <ActivityCard
                      key={index}
                      activity={app}
                      totalSeconds={calculateTotalSeconds()}
                    />
                  ))}
              </div>
            ) : (
              <p className="no-data">No activity recorded yet. Start tracking to see your app usage!</p>
            )}
          </section>

          {/* Today's Timeline */}
          {todaySessions.length > 0 && (
            <section className="timeline-section">
              <h2>Today's Timeline</h2>
              <div className="timeline">
                {getFirstSession() && (
                  <div className="timeline-item">
                    <span className="timeline-label">First Session Start</span>
                    <span className="timeline-time">{formatTime(getFirstSession().startTime)}</span>
                  </div>
                )}
                {getLastSession() && getLastSession().endTime && (
                  <div className="timeline-item">
                    <span className="timeline-label">Last Session End</span>
                    <span className="timeline-time">{formatTime(getLastSession().endTime)}</span>
                  </div>
                )}
                <div className="timeline-item">
                  <span className="timeline-label">Total Sessions</span>
                  <span className="timeline-time">{todaySessions.length}</span>
                </div>
              </div>
            </section>
          )}

          {/* Sessions Overview - Compact view (no screenshots here) */}
          {todaySessions.length > 0 && (
            <section className="sessions-section">
              <h2>Today's Sessions</h2>
              <div className="sessions-list">
                {todaySessions.map((session, index) => (
                  <div key={session._id} className={`session-card ${session.status}`}>
                    <div className="session-header">
                      <span className="session-number">Session #{todaySessions.length - index}</span>
                      <span className={`session-status ${session.status}`}>
                        {session.status === 'active' ? '🔴 Active' : '✅ Completed'}
                      </span>
                    </div>
                    <div className="session-details">
                      <div className="session-time">
                        <span className="label">Start:</span>
                        <span className="value">{formatTime(session.startTime)}</span>
                      </div>
                      {session.endTime && (
                        <div className="session-time">
                          <span className="label">End:</span>
                          <span className="value">{formatTime(session.endTime)}</span>
                        </div>
                      )}
                      <div className="session-time">
                        <span className="label">Duration:</span>
                        <span className="value">{formatDuration(session.durationSeconds)}</span>
                      </div>
                      <div className="session-time">
                        <span className="label">Activities:</span>
                        <span className="value">{session.activities?.length || 0} apps</span>
                      </div>
                      {session.screenshots && session.screenshots.length > 0 && (
                        <div className="session-time">
                          <span className="label">Screenshots:</span>
                          <span className="value">{session.screenshots.length} captured</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ✅ NEW: SCREENSHOTS TAB */}
      {activeTab === 'screenshots' && (
        <>
          {todaySessions.length > 0 ? (
            <ScreenshotManager 
              session={{
                _id: todaySessions[0]._id,  // Most recent session
                date: today()
              }}
            />
          ) : (
            <section className="no-data-section">
              <div className="no-data-message">
                <p className="no-data-icon">📸</p>
                <p className="no-data">No screenshots available</p>
                <small>Start tracking to capture screenshots automatically</small>
              </div>
            </section>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <>
          {/* Date Range Filter */}
          <section className="filter-section">
            <h2>Filter by Date Range</h2>
            <div className="date-range-filter">
              <div className="date-input-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate || ''}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="date-input"
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-input-group">
                <label>End Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate || ''}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  max={today()}
                  className="date-input"
                />
              </div>
              {(dateRange.startDate || dateRange.endDate) && (
                <button 
                  onClick={() => setDateRange({ startDate: null, endDate: null })}
                  className="clear-filter-btn"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </section>

          {/* Attendance History Table */}
          <section className="attendance-history-section">
            <h2>My Attendance History</h2>
            {loading ? (
              <p className="loading-text">Loading attendance...</p>
            ) : attendanceHistory.length > 0 ? (
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>First Session</th>
                      <th>Last Session</th>
                      <th>Total Time</th>
                      <th>Sessions</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record) => (
                      <tr key={record._id}>
                        <td className="date-cell">{formatDate(record.date)}</td>
                        <td>{formatTime(record.firstSessionStart)}</td>
                        <td>{formatTime(record.lastSessionEnd)}</td>
                        <td className="duration-cell">{formatDuration(record.totalWorkSeconds)}</td>
                        <td className="sessions-cell">{record.sessionsCount}</td>
                        <td>
                          <span className={`status-badge ${record.status}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No attendance records found. Start tracking to build your history!</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;