import React, { useState, useEffect } from 'react';
// import AttendanceTable from '../components/AttendanceTable';
import AttendanceTable from './AttendanceTable';
import ScreenshotsViewer from './ScreenshotsViewer';
import './AdminDashboard.css';

const CATEGORIES = [
  "Development", "Design", "Communication",
  "Documentation", "Web Browsing", "Entertainment",
  "Uncategorized", "Other"
];

export default function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('overview');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [userSessions, setUserSessions] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showAddActivity, setShowAddActivity] = useState(null);
  const [showSettings, setShowSettings] = useState(null);
  const [userSettings, setUserSettings] = useState({});
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [newActivity, setNewActivity] = useState({
    app: '', site: '-', seconds: 0, category: 'Uncategorized'
  });

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchAllUsers();
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeView === 'overview') fetchDashboard();
  }, [selectedDate, activeView]);

  useEffect(() => {
    if (selectedUser) fetchUserSessions();
  }, [selectedUser, selectedDate]);

  const fetchAllUsers = async () => {
    try {
      const result = await window.electron.getUsers();
      if (result.success) setAllUsers(result.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const result = await window.electron.getHRDashboard({ date: selectedDate });
      if (result.success) setDashboardData(result.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSessions = async () => {
    if (!selectedUser) return;
    try {
      setLoading(true);
      const result = await window.electron.getSessions({
        userId: selectedUser._id,
        date: selectedDate
      });
      if (result.success) setUserSessions(result.data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (emp) => {
    setSelectedUser(emp);
    setActiveView('user-detail');
  };

  const handleViewAttendance = (emp) => {
    setSelectedUser(emp);
    setActiveView('user-attendance');
    setDateRange({ startDate: null, endDate: null });
  };

  const handleOpenSettings = async (emp) => {
    setSelectedUser(emp);
    const result = await window.electron.getUserSettings({ userId: emp._id });
    if (result.success) {
      setUserSettings(result.settings);
    }
    setShowSettings(emp);
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    const result = await window.electron.updateUserRole({ userId, role: newRole });
    if (result.success) {
      await fetchAllUsers();
      alert(`✅ Role updated to ${newRole}`);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ DELETE user "${username}"? This will delete ALL their data!`)) return;
    const result = await window.electron.deleteUser({ userId });
    if (result.success) {
      await fetchAllUsers();
      await fetchDashboard();
      alert('✅ User deleted');
    }
  };

  const handleEditActivity = (sessionId, activityIndex, activity) => {
    setEditingActivity({ sessionId, activityIndex, ...activity });
  };

  const handleSaveActivity = async () => {
    if (!editingActivity) return;
    const result = await window.electron.editActivity({
      sessionId: editingActivity.sessionId,
      activityIndex: editingActivity.activityIndex,
      updates: {
        seconds: editingActivity.seconds,
        category: editingActivity.category,
        app: editingActivity.app
      }
    });
    if (result.success) {
      setEditingActivity(null);
      await fetchUserSessions();
      alert('✅ Activity updated');
    }
  };

  const handleDeleteActivity = async (sessionId, activityIndex, appName) => {
    if (!window.confirm(`Delete activity "${appName}"?`)) return;
    const result = await window.electron.deleteActivity({ sessionId, activityIndex });
    if (result.success) {
      await fetchUserSessions();
    }
  };

  const handleAddActivity = async (sessionId) => {
    const result = await window.electron.addActivity({
      sessionId,
      activity: newActivity
    });
    if (result.success) {
      setShowAddActivity(null);
      setNewActivity({ app: '', site: '-', seconds: 0, category: 'Uncategorized' });
      await fetchUserSessions();
      alert('✅ Activity added');
    }
  };

  const handleDeleteScreenshot = async (sessionId, filename) => {
    if (!window.confirm('Delete this screenshot?')) return;
    const result = await window.electron.deleteScreenshot({ sessionId, filename });
    if (result.success) {
      await fetchUserSessions();
    }
  };

  const handleSaveSettings = async () => {
    if (!showSettings) return;
    const result = await window.electron.updateUserSettings({
      userId: showSettings._id,
      settings: userSettings
    });
    if (result.success) {
      setShowSettings(null);
      alert('✅ Settings saved');
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setUserSessions([]);
    setActiveView('overview');
    fetchDashboard();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'ADMIN') return '#7c3aed';
    if (role === 'HR') return '#0891b2';
    return '#059669';
  };

  const getProductivityColor = (p) => {
    if (p >= 70) return '#10b981';
    if (p >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">⚙️</div>
          <div>
            <h1>Admin Dashboard</h1>
            <p>{user.name} · Administrator</p>
          </div>
        </div>
        <button onClick={onLogout} className="admin-logout">Logout</button>
      </header>

      {/* Nav Tabs */}
      {!selectedUser && (
        <div className="admin-tabs">
          {['overview', 'users', 'attendance'].map(view => (
            <button
              key={view}
              className={`admin-tab ${activeView === view ? 'active' : ''}`}
              onClick={() => { setActiveView(view); setSelectedUser(null); }}
            >
              {view === 'overview' && '📊 Overview'}
              {view === 'users' && '👥 Manage Users'}
              {view === 'attendance' && '📅 Attendance'}
            </button>
          ))}
        </div>
      )}

      {/* Back Button + Date Controls */}
      <div className="admin-controls">
        {selectedUser && (
          <button onClick={handleBack} className="admin-back-btn">
            ← Back
          </button>
        )}

        {(activeView === 'overview' || activeView === 'user-detail') && (
          <div className="admin-date-control">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        {(activeView === 'attendance' || activeView === 'user-attendance') && (
          <div className="admin-date-range">
            <input
              type="date"
              value={dateRange.startDate || ''}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.endDate || ''}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        )}
      </div>

      {loading && (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      )}

      {/* ======================== OVERVIEW ======================== */}
      {!loading && activeView === 'overview' && !selectedUser && (
        <div className="admin-section">
          <h2>All Employees — {new Date(selectedDate).toLocaleDateString()}</h2>
          {dashboardData.length === 0 ? (
            <div className="admin-empty">No activity for this date.</div>
          ) : (
            <div className="admin-grid">
              {dashboardData.map((item) => (
                <div key={item.employee._id} className="admin-card">
                  <div className="admin-card-top">
                    <div className="admin-avatar">{item.employee.name[0]}</div>
                    <div>
                      <h3>{item.employee.name}</h3>
                      <p>@{item.employee.username}</p>
                    </div>
                  </div>

                  <div className="admin-card-stats">
                    <span>⏱️ {formatDuration(item.totalSeconds)}</span>
                    <span>📅 {item.sessions.length} sessions</span>
                    <span
                      className="productivity-pill"
                      style={{ background: getProductivityColor(item.productivity || 0) }}
                    >
                      {item.productivity || 0}%
                    </span>
                  </div>

                  <div className="admin-card-actions">
                    <button className="btn-primary" onClick={() => handleViewUser(item.employee)}>
                      📊 Sessions
                    </button>
                    <button className="btn-secondary" onClick={() => handleViewAttendance(item.employee)}>
                      📅 Attendance
                    </button>
                    <button className="btn-settings" onClick={() => handleOpenSettings(item.employee)}>
                      ⚙️ Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================== MANAGE USERS ======================== */}
      {activeView === 'users' && !selectedUser && (
        <div className="admin-section">
          <h2>👥 All Users ({allUsers.length})</h2>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>@{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className="role-badge"
                        style={{ background: getRoleBadgeColor(u.role) }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="user-actions">
                        <select
                          className="role-select"
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="HR">HR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          className="btn-danger-sm"
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          disabled={u._id === user._id}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================== ALL ATTENDANCE ======================== */}
      {activeView === 'attendance' && !selectedUser && (
        <div className="admin-section">
          <AttendanceTable
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            showEmployee={true}
          />
        </div>
      )}

      {/* ======================== USER ATTENDANCE ======================== */}
      {activeView === 'user-attendance' && selectedUser && (
        <div className="admin-section">
          <div className="selected-user-banner">
            <div className="admin-avatar">{selectedUser.name[0]}</div>
            <div>
              <h2>{selectedUser.name}</h2>
              <p>@{selectedUser.username}</p>
            </div>
            <button
              className="btn-settings"
              onClick={() => handleViewUser(selectedUser)}
            >
              📊 View Sessions
            </button>
          </div>
          <AttendanceTable
            userId={selectedUser._id}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            showEmployee={false}
          />
        </div>
      )}

      {/* ======================== USER DETAIL (Sessions + Edit) ======================== */}
      {!loading && activeView === 'user-detail' && selectedUser && (
        <div className="admin-section">
          <div className="selected-user-banner">
            <div className="admin-avatar">{selectedUser.name[0]}</div>
            <div>
              <h2>{selectedUser.name}</h2>
              <p>@{selectedUser.username}</p>
            </div>
            <div className="banner-actions">
              <button className="btn-secondary" onClick={() => handleViewAttendance(selectedUser)}>
                📅 Attendance
              </button>
              <button className="btn-settings" onClick={() => handleOpenSettings(selectedUser)}>
                ⚙️ Settings
              </button>
            </div>
          </div>

          {userSessions.length === 0 ? (
            <div className="admin-empty">No sessions for this date.</div>
          ) : (
            userSessions.map((session, sIdx) => (
              <div key={session._id} className="admin-session-card">
                {/* Session Header */}
                <div className="session-card-header">
                  <div>
                    <span className="session-num">Session #{userSessions.length - sIdx}</span>
                    <span className={`session-status-badge ${session.status}`}>
                      {session.status === 'active' ? '🔴 Active' : '✅ Completed'}
                    </span>
                  </div>
                  <div className="session-times">
                    <span>🕐 {formatDateTime(session.startTime)}</span>
                    {session.endTime && <span>→ {formatDateTime(session.endTime)}</span>}
                    <span>⏱️ {formatDuration(session.durationSeconds)}</span>
                  </div>
                </div>

                {/* Activities Table with Edit */}
                <div className="admin-activities">
                  <div className="activities-header">
                    <h4>Activities ({session.activities?.length || 0})</h4>
                    <button
                      className="btn-add"
                      onClick={() => setShowAddActivity(session._id)}
                    >
                      + Add Activity
                    </button>
                  </div>

                  {session.activities && session.activities.length > 0 && (
                    <table className="activities-table">
                      <thead>
                        <tr>
                          <th>App</th>
                          <th>Site</th>
                          <th>Time</th>
                          <th>Clicks</th>
                          <th>Category</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.activities
                          .sort((a, b) => b.seconds - a.seconds)
                          .map((activity, aIdx) => (
                            <tr key={aIdx}>
                              <td><strong>{activity.app}</strong></td>
                              <td>{activity.site || '-'}</td>
                              <td>{formatDuration(activity.seconds)}</td>
                              <td>{activity.clicks}</td>
                              <td>
                                <span className="category-badge">{activity.category}</span>
                              </td>
                              <td>
                                <div className="activity-actions">
                                  <button
                                    className="btn-edit-sm"
                                    onClick={() => handleEditActivity(session._id, aIdx, activity)}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    className="btn-delete-sm"
                                    onClick={() => handleDeleteActivity(session._id, aIdx, activity.app)}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {/* Add Activity Form */}
                  {showAddActivity === session._id && (
                    <div className="add-activity-form">
                      <h4>➕ Add Manual Activity</h4>
                      <div className="form-row">
                        <input
                          placeholder="App name"
                          value={newActivity.app}
                          onChange={(e) => setNewActivity({ ...newActivity, app: e.target.value })}
                        />
                        <input
                          placeholder="Website (optional)"
                          value={newActivity.site}
                          onChange={(e) => setNewActivity({ ...newActivity, site: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Seconds"
                          value={newActivity.seconds}
                          onChange={(e) => setNewActivity({ ...newActivity, seconds: parseInt(e.target.value) || 0 })}
                        />
                        <select
                          value={newActivity.category}
                          onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                        >
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-actions">
                        <button className="btn-primary" onClick={() => handleAddActivity(session._id)}>
                          ✅ Add
                        </button>
                        <button className="btn-secondary" onClick={() => setShowAddActivity(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Screenshots with Delete */}
                {session.screenshots && session.screenshots.length > 0 && (
                  <div className="admin-screenshots">
                    <h4>📸 Screenshots ({session.screenshots.length})</h4>
                    <ScreenshotsViewer
                      session={session}
                      adminMode={true}
                      onDeleteScreenshot={(filename) => handleDeleteScreenshot(session._id, filename)}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================== EDIT ACTIVITY MODAL ======================== */}
      {editingActivity && (
        <div className="admin-modal-overlay" onClick={() => setEditingActivity(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit Activity</h3>

            <div className="modal-form">
              <label>App Name</label>
              <input
                value={editingActivity.app}
                onChange={(e) => setEditingActivity({ ...editingActivity, app: e.target.value })}
              />

              <label>Time (seconds)</label>
              <input
                type="number"
                value={editingActivity.seconds}
                onChange={(e) => setEditingActivity({ ...editingActivity, seconds: parseInt(e.target.value) || 0 })}
              />
              <small>{formatDuration(editingActivity.seconds)}</small>

              <label>Category</label>
              <select
                value={editingActivity.category}
                onChange={(e) => setEditingActivity({ ...editingActivity, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveActivity}>✅ Save</button>
              <button className="btn-secondary" onClick={() => setEditingActivity(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== SETTINGS MODAL ======================== */}
      {showSettings && (
        <div className="admin-modal-overlay" onClick={() => setShowSettings(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚙️ Tracking Settings — {showSettings.name}</h3>

            <div className="modal-form">
              <label>Screenshot Interval (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={userSettings.screenshotInterval || 10}
                onChange={(e) => setUserSettings({ ...userSettings, screenshotInterval: parseInt(e.target.value) })}
              />

              <label>Work Hours Start</label>
              <input
                type="time"
                value={userSettings.workHoursStart || '09:00'}
                onChange={(e) => setUserSettings({ ...userSettings, workHoursStart: e.target.value })}
              />

              <label>Work Hours End</label>
              <input
                type="time"
                value={userSettings.workHoursEnd || '18:00'}
                onChange={(e) => setUserSettings({ ...userSettings, workHoursEnd: e.target.value })}
              />

              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={userSettings.trackingEnabled !== false}
                  onChange={(e) => setUserSettings({ ...userSettings, trackingEnabled: e.target.checked })}
                />
                <span>Tracking Enabled</span>
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveSettings}>✅ Save Settings</button>
              <button className="btn-secondary" onClick={() => setShowSettings(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}