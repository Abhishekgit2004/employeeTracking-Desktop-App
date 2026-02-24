import { useState, useEffect } from "react";
// import AttendanceTable from "../components/AttendanceTable";
import AttendanceTable from "./AttendanceTable";
import ScreenshotManager from "./ScreenshotManager";
export default function EmployeeDashboard({ user, onLogout }) {
  const [attendanceStatus, setAttendanceStatus] = useState({
    active: false,
    loginTime: null,
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [todayActivity, setTodayActivity] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'

  useEffect(() => {
    checkAttendanceStatus();
    fetchTodayData();
  }, []);

  useEffect(() => {
    let interval;
    if (attendanceStatus.active && attendanceStatus.loginTime) {
      interval = setInterval(() => {
        const start = new Date(attendanceStatus.loginTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        setElapsedTime(diff);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendanceStatus]);

  useEffect(() => {
    if (activeTab === 'today') {
      fetchDataForDate(selectedDate);
    }
  }, [selectedDate, activeTab]);

  const checkAttendanceStatus = async () => {
    const status = await window.electron.getSessionStatus();
    setAttendanceStatus(status);
  };

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split("T")[0];
    await fetchDataForDate(today);
  };

  const fetchDataForDate = async (date) => {
    try {
      const attResponse = await window.electron.getAttendance({
        userId: user._id,
        startDate: date,
        endDate: date,
      });
      console.log(attResponse)

      if (attResponse.success && attResponse.data.length > 0) {
        setTodayAttendance(attResponse.data[0]);
        console.log("newData",attResponse.data[0])
      } else {
        setTodayAttendance(null);
      }

      const actResponse = await window.electron.getActivity({
        userId: user._id,
        date: date,
      });

      if (actResponse.success && actResponse.data.length > 0) {
        setTodayActivity(actResponse.data[0].activities || []);
      } else {
        setTodayActivity([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleStartTracking = async () => {
    const result = await window.electron.startSession();
    if (result.success) {
      await checkAttendanceStatus();
      await fetchTodayData();
    } else {
      alert(result.message);
    }
  };

  const handleStopTracking = async () => {
    const result = await window.electron.stopSession();
    if (result.success) {
      await checkAttendanceStatus();
      await fetchTodayData();
      setElapsedTime(0);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const getTotalStats = () => {
    const totalSeconds = todayActivity.reduce((sum, app) => sum + app.seconds, 0);
    const totalClicks = todayActivity.reduce((sum, app) => sum + app.clicks, 0);
    return { totalSeconds, totalClicks };
  };

  const stats = getTotalStats();

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerContent}>
          <div>
            <h1 style={S.title}>Welcome, {user.name}</h1>
            <p style={S.subtitle}>@{user.username}</p>
          </div>
          <button onClick={onLogout} style={S.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={S.container}>
        {/* Tracking Control */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h2 style={S.cardTitle}>Time Tracking</h2>
          </div>

          <div style={S.trackingControl}>
            {attendanceStatus.active ? (
              <>
                <div style={S.statusActive}>
                  <div style={S.statusDot} />
                  <span>Tracking Active</span>
                </div>
                <div style={S.timer}>{formatTime(elapsedTime)}</div>
                <button onClick={handleStopTracking} style={S.btnStop}>
                  Stop Tracking
                </button>
              </>
            ) : (
              <>
                <p style={S.statusInactive}>
                  Start tracking to monitor your activity
                </p>
                <button onClick={handleStartTracking} style={S.btnStart}>
                  Start Tracking
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabsContainer}>
          <button 
            style={activeTab === 'today' ? {...S.tab, ...S.tabActive} : S.tab}
            onClick={() => setActiveTab('today')}
          >
            📊 Today's Activity
          </button>
          <button 
            style={activeTab === 'history' ? {...S.tab, ...S.tabActive} : S.tab}
            onClick={() => setActiveTab('history')}
          >
            📅 My Attendance History
          </button>
        </div>

        {/* Today's Activity Tab */}
        {activeTab === 'today' && (
          <>
            {/* Date Selector */}
            <div style={S.card}>
              <label style={S.dateLabel}>View Date:</label>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={S.dateInput}
              />
            </div>

            {/* Stats */}
            <div style={S.statsGrid}>
              <div style={{ ...S.statCard, ...S.statBlue }}>
                <div style={S.statValue}>{formatDuration(stats.totalSeconds)}</div>
                <div style={S.statLabel}>Work Time</div>
              </div>

              <div style={{ ...S.statCard, ...S.statPurple }}>
                <div style={S.statValue}>{todayActivity.length}</div>
                <div style={S.statLabel}>Apps Used</div>
              </div>

              <div style={{ ...S.statCard, ...S.statGreen }}>
                <div style={S.statValue}>{stats.totalClicks}</div>
                <div style={S.statLabel}>Clicks</div>
              </div>
            </div>

            {/* Activity Table */}
            <div style={S.card}>
              <h2 style={S.cardTitle}>Activity Log</h2>

              {todayActivity.length === 0 ? (
                <p style={S.emptyState}>No activity recorded for this date</p>
              ) : (
                <div style={S.tableWrapper}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Application</th>
                        <th style={S.th}>Category</th>
                        <th style={S.th}>Time</th>
                        <th style={S.th}>Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayActivity
                        .sort((a, b) => b.seconds - a.seconds)
                        .map((app, index) => (
                          <tr key={index} style={S.tr}>
                            <td style={S.td}>{app.app}</td>
                            <td style={S.td}>
                              <span style={S.badge}>{app.category || "Other"}</span>
                            </td>
                            <td style={S.td}>{formatDuration(app.seconds)}</td>
                            <td style={S.td}>{app.clicks}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
             {/* ✅ NEW: Screenshot Manager */}
    {todayAttendance.sessionIds && todayAttendance.sessionIds.length > 0 && (
      <ScreenshotManager 
        session={{
          _id: todayAttendance.sessionIds[0], // Latest session
          date: selectedDate
        }}
      />
    )}

          </>
        )}

  

   

        {/* Attendance History Tab */}
        {activeTab === 'history' && (
          <>
            <div style={S.card}>
              <label style={S.dateLabel}>Date Range (Optional):</label>
              <div style={S.dateRangeContainer}>
                <input
                  type="date"
                  value={dateRange.startDate || ''}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  style={S.dateInput}
                  placeholder="Start Date"
                />
                <span style={{ margin: '0 10px', color: 'var(--text-secondary)' }}>to</span>
                <input
                  type="date"
                  value={dateRange.endDate || ''}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  style={S.dateInput}
                  max={new Date().toISOString().split("T")[0]}
                  placeholder="End Date"
                />
              </div>
              {(dateRange.startDate || dateRange.endDate) && (
                <button 
                  onClick={() => setDateRange({ startDate: null, endDate: null })}
                  style={S.clearBtn}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* ✅ FIXED: Pass userId to show ONLY this employee's attendance */}
            <AttendanceTable
              userId={user._id}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              showEmployee={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ─── styles ─── */
const S = {
  root: {
    minHeight: "100vh",
    background: "var(--bg)",
    paddingBottom: 40,
  },

  header: {
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
    padding: "20px 0",
  },

  headerContent: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
  },

  logoutBtn: {
    padding: "10px 20px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-input)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity .2s",
  },

  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-card)",
    padding: 24,
  },

  cardHeader: {
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--text-primary)",
  },

  trackingControl: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "20px 0",
  },

  statusActive: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--accent)",
    fontWeight: 600,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--accent)",
    animation: "pulse 2s infinite",
  },

  statusInactive: {
    color: "var(--text-secondary)",
  },

  timer: {
    fontSize: 48,
    fontWeight: 700,
    fontFamily: "monospace",
    color: "var(--text-primary)",
  },

  btnStart: {
    padding: "12px 32px",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-input)",
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    transition: "opacity .2s",
  },

  btnStop: {
    padding: "12px 32px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-input)",
    fontWeight: 600,
    fontSize: 16,
    cursor: "pointer",
    transition: "opacity .2s",
  },

  tabsContainer: {
    display: 'flex',
    gap: 8,
    background: 'var(--surface)',
    padding: 4,
    borderRadius: 'var(--radius-card)',
    border: '1px solid var(--border)',
  },

  tab: {
    flex: 1,
    padding: '12px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'calc(var(--radius-card) - 4px)',
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  tabActive: {
    background: 'var(--accent)',
    color: '#fff',
  },

  dateLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 8,
    display: "block",
  },

  dateInput: {
    width: "100%",
    padding: 12,
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    borderRadius: "var(--radius-input)",
    color: "var(--text-primary)",
    fontSize: 15,
  },

  dateRangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },

  clearBtn: {
    marginTop: 12,
    padding: '8px 16px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-input)',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },

  statCard: {
    padding: 24,
    borderRadius: "var(--radius-card)",
    textAlign: "center",
  },

  statBlue: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },

  statPurple: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },

  statGreen: {
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },

  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: 16,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "1px solid var(--border)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: ".05em",
  },

  tr: {
    borderBottom: "1px solid var(--border)",
  },

  td: {
    padding: "12px 16px",
    color: "var(--text-primary)",
  },

  badge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "var(--input-bg)",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--accent)",
  },

  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "var(--text-secondary)",
  },
};