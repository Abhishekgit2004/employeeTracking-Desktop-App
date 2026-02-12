const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const activeWin = require("active-win");
const categorize = require("./helper/helper.js");
const User = require("./model/user.model.js");
const connectDB = require("./config/db.js");
const Session = require("./model/Session.js");
const { USER_ROLE } = require("./enum.js");
const bcrypt = require("bcrypt");

/* =====================================================
   GLOBAL STATE
===================================================== */
let mainWindow;
let isQuitting = false;

// ✅ SESSION-BASED TRACKING
let currentSessionId = null;
let activityData = {}; 
let mouseClicks = 0;
let lastApp = null;
let lastSite = null;
let lastTime = Date.now();

let trackingInterval = null;
let trackingRunning = false;
let sessionStartTime = null;
let autoSaveInterval = null;

/* =====================================================
   WINDOW
===================================================== */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://localhost:5173");

  mainWindow.on('close', async (event) => {
    if (isQuitting) return;

    if (trackingRunning) {
      event.preventDefault();
      
      const response = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Save & Quit', 'Cancel'],
        defaultId: 0,
        title: 'Tracking Active',
        message: 'You are currently tracking time!',
        detail: 'Closing now will save your session and stop tracking. Do you want to continue?'
      });

      if (response.response === 0) {
        console.log("💾 Saving session before closing...");
        isQuitting = true;
        await endSession();
        console.log("✅ Session saved successfully");
        mainWindow.close();
      }
    }
  });
}

/* =====================================================
   HELPERS
===================================================== */
function today() {
  return new Date().toISOString().split("T")[0];
}

function extractWebsite(title) {
  if (!title) return "-";
  return title
    .replace(/ - (Google Chrome|Microsoft Edge|Brave|Firefox)/i, "")
    .split(" | ")
    .pop()
    .split(" - ")
    .pop();
}

/* =====================================================
   PERIODIC AUTO-SAVE
===================================================== */
async function periodicSave() {
  if (!trackingRunning || !currentSessionId || !global.CURRENT_USER_ID) {
    return;
  }

  try {
    const now = new Date();
    const durationSeconds = Math.floor((now - sessionStartTime) / 1000);

    console.log(`💾 Auto-saving session... (${durationSeconds} seconds)`);

    // Prepare activities
    const activities = Object.values(activityData).map(item => {
      const categorization = categorize(item.app, item.site, item.seconds);
      return {
        app: item.app,
        site: item.site,
        seconds: item.seconds,
        clicks: item.clicks,
        category: categorization.category || "Uncategorized"
      };
    });

    // Update session with current data
    await Session.findByIdAndUpdate(currentSessionId, {
      durationSeconds,
      activities
    });

    console.log(`💾 Auto-saved session with ${activities.length} activities`);
  } catch (err) {
    console.error("❌ Auto-save error:", err);
  }
}

function startPeriodicSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(periodicSave, 2 * 60 * 1000);
  console.log("✅ Periodic auto-save started (every 2 minutes)");
}

function stopPeriodicSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    console.log("⏹️ Periodic auto-save stopped");
  }
}

/* =====================================================
   ACTIVITY AGGREGATION
===================================================== */
function aggregateActivity(appName, site, seconds, clicks) {
  const key = appName;
  
  if (!activityData[key]) {
    activityData[key] = {
      app: appName,
      site: site,
      seconds: 0,
      clicks: 0
    };
  }
  
  activityData[key].seconds += seconds;
  activityData[key].clicks += clicks;
}

/* =====================================================
   TRACKER
===================================================== */
async function track() {
  if (!trackingRunning) return;

  try {
    const win = await activeWin();
    if (!win || !win.owner?.name) return;

    const now = Date.now();
    const diff = Math.floor((now - lastTime) / 1000);
    if (diff <= 0) return;

    lastTime = now;

    let appName = win.owner.name;
    let site = "-";

    const browsers = ["chrome", "edge", "brave", "firefox"];
    if (browsers.some(b => appName.toLowerCase().includes(b))) {
      site = extractWebsite(win.title);
    }

    if (lastApp) {
      aggregateActivity(lastApp, lastSite, diff, mouseClicks);
      mouseClicks = 0;
    }

    lastApp = appName;
    lastSite = site;
  } catch (err) {
    console.error("Tracking error:", err);
  }
}

/* =====================================================
   TRACK CONTROL
===================================================== */
function startTracking() {
  if (trackingInterval) return;

  lastTime = Date.now();
  lastApp = null;
  lastSite = null;

  trackingInterval = setInterval(track, 5000);
  startPeriodicSave();
}

function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  stopPeriodicSave();
  lastApp = null;
  lastSite = null;
}

/* =====================================================
   SESSION MANAGEMENT
===================================================== */

// ✅ START NEW SESSION
async function startSession() {
  try {
    if (!global.CURRENT_USER_ID) {
      return { success: false, message: "No user logged in" };
    }

    if (trackingRunning) {
      return { success: false, message: "Already tracking" };
    }

    const now = new Date();
    sessionStartTime = now;
    activityData = {};

    // Create new session document
    const session = await Session.create({
      userId: global.CURRENT_USER_ID,
      date: today(),
      startTime: now,
      endTime: null,
      durationSeconds: 0,
      activities: [],
      status: 'active'
    });

    currentSessionId = session._id.toString();
    trackingRunning = true;
    startTracking();

    console.log(`✅ New session started: ${currentSessionId}`);

    return {
      success: true,
      message: "Session started",
      sessionId: currentSessionId,
      startTime: now.toISOString()
    };

  } catch (err) {
    console.error("❌ Error starting session:", err);
    return { success: false, message: "Failed to start session" };
  }
}

// ✅ END CURRENT SESSION
async function endSession() {
  try {
    if (!trackingRunning || !currentSessionId) {
      return { success: false, message: "No active session" };
    }

    const now = new Date();
    const durationSeconds = Math.floor((now - sessionStartTime) / 1000);

    console.log(`📊 Ending session: ${currentSessionId}`);
    console.log(`⏱️ Duration: ${durationSeconds} seconds`);

    stopTracking();

    // Prepare final activities
    const activities = Object.values(activityData).map(item => {
      const categorization = categorize(item.app, item.site, item.seconds);
      return {
        app: item.app,
        site: item.site,
        seconds: item.seconds,
        clicks: item.clicks,
        category: categorization.category || "Uncategorized"
      };
    });

    // Update session with final data
    await Session.findByIdAndUpdate(currentSessionId, {
      endTime: now,
      durationSeconds,
      activities,
      status: 'completed'
    });

    console.log(`✅ Session ended with ${activities.length} activities`);

    // Clear session state
    currentSessionId = null;
    sessionStartTime = null;
    activityData = {};
    trackingRunning = false;

    return {
      success: true,
      message: "Session ended successfully",
      durationSeconds
    };

  } catch (err) {
    console.error("❌ Error ending session:", err);
    
    // Reset state even on error
    currentSessionId = null;
    sessionStartTime = null;
    activityData = {};
    trackingRunning = false;
    
    return { success: false, message: err.message };
  }
}

/* =====================================================
   IPC HANDLERS
===================================================== */

// -------- REGISTRATION --------
ipcMain.handle("register", async (event, payload) => {
  try {
    const { name, username, email, password, role } = payload;

    if (!name || !username || !email || !password) {
      return { success: false, message: "Required fields missing" };
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return { success: false, message: "Username already exists" };
    }

    const emailTaken = await User.findOne({ email }).lean();
    if (emailTaken) {
      return { success: false, message: "Email is already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: (role || USER_ROLE.EMPLOYEE).toUpperCase(),
    });

    return {
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err) {
    console.error("Register error:", err);
    return { success: false, message: "Registration failed" };
  }
});

// -------- LOGIN --------
ipcMain.handle("login", async (_, { username, password }) => {
  try {
    const user = await User.findOne({ username }).lean();

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, message: "Invalid password" };
    }

    global.CURRENT_USER_ID = user._id.toString();

    // Check for incomplete session
    const incompleteSession = await Session.findOne({
      userId: user._id,
      status: 'active'
    }).lean();

    const safeUser = {
      _id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return {
      success: true,
      message: "Login successful",
      user: safeUser,
      hasIncompleteSession: !!incompleteSession,
      incompleteSessionId: incompleteSession?._id.toString()
    };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, message: "Login failed" };
  }
});

// -------- START WORK --------
ipcMain.handle("session:start", async () => {
  return await startSession();
});

// -------- STOP WORK --------
ipcMain.handle("session:stop", async () => {
  return await endSession();
});

// -------- SESSION STATUS --------
ipcMain.handle("session:status", async () => {
  if (trackingRunning && currentSessionId) {
    return {
      active: true,
      sessionId: currentSessionId,
      startTime: sessionStartTime.toISOString()
    };
  }

  // Check for incomplete session in DB
  if (global.CURRENT_USER_ID) {
    try {
      const incompleteSession = await Session.findOne({
        userId: global.CURRENT_USER_ID,
        status: 'active'
      }).lean();

      if (incompleteSession) {
        return {
          active: false,
          hasIncompleteSession: true,
          sessionId: incompleteSession._id.toString(),
          startTime: incompleteSession.startTime
        };
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  }

  return {
    active: false,
    sessionId: null
  };
});

// -------- RESUME INCOMPLETE SESSION --------
ipcMain.handle("session:resume", async (_, { sessionId }) => {
  try {
    const session = await Session.findById(sessionId).lean();
    
    if (!session || session.status !== 'active') {
      return { success: false, message: "Session not found or already completed" };
    }

    // Resume the session
    currentSessionId = sessionId;
    sessionStartTime = new Date(session.startTime);
    trackingRunning = true;

    // Restore activity data
    activityData = {};
    if (session.activities && session.activities.length > 0) {
      session.activities.forEach(act => {
        activityData[act.app] = {
          app: act.app,
          site: act.site,
          seconds: act.seconds,
          clicks: act.clicks
        };
      });
    }

    startTracking();

    console.log(`✅ Resumed session: ${sessionId}`);

    return {
      success: true,
      message: "Session resumed",
      sessionId,
      startTime: session.startTime
    };

  } catch (err) {
    console.error("Error resuming session:", err);
    return { success: false, message: "Failed to resume session" };
  }
});

// -------- GET CURRENT ACTIVITY (IN-MEMORY) --------
ipcMain.handle("activity:current", async () => {
  try {
    if (!trackingRunning || !currentSessionId) {
      return { success: false, message: "No active session" };
    }

    const activities = Object.values(activityData).map(item => ({
      app: item.app,
      site: item.site,
      seconds: item.seconds,
      clicks: item.clicks,
      category: categorize(item.app, item.site, item.seconds).category || "Uncategorized"
    }));

    return {
      success: true,
      activities,
      isLive: true
    };
  } catch (err) {
    console.error("Get current activity error:", err);
    return { success: false, message: "Failed to fetch current activity" };
  }
});

// -------- GET USER SESSIONS (FIXED DATE FILTERING) --------
ipcMain.handle("sessions:get", async (_, { userId, date, startDate, endDate }) => {
  try {
    const query = { userId };

    if (date) {
      // For exact date match, query sessions where the date field equals the provided date
      query.date = date;
    } else if (startDate || endDate) {
      // For date range
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    console.log("📅 Sessions query:", JSON.stringify(query));

    const sessions = await Session.find(query)
      .populate("userId", "name username email")
      .sort({ startTime: -1 })
      .lean();

    console.log(`📊 Found ${sessions.length} sessions`);

    return {
      success: true,
      data: sessions.map(session => ({
        ...session,
        _id: session._id.toString(),
        userId: session.userId ? {
          _id: session.userId._id.toString(),
          name: session.userId.name,
          username: session.userId.username
        } : null
      }))
    };
  } catch (err) {
    console.error("Get sessions error:", err);
    return { success: false, message: "Failed to fetch sessions" };
  }
});

// -------- GET ALL EMPLOYEES --------
ipcMain.handle("employees:getAll", async () => {
  try {
    const employees = await User.find({ role: USER_ROLE.EMPLOYEE })
      .select("name username email")
      .lean();

    return {
      success: true,
      data: employees.map(emp => ({
        ...emp,
        _id: emp._id.toString()
      }))
    };
  } catch (err) {
    console.error("Get employees error:", err);
    return { success: false, message: "Failed to fetch employees" };
  }
});

// -------- HR DASHBOARD (FIXED DATE FILTERING) --------
ipcMain.handle("hr:dashboard", async (_, { date }) => {
  try {
    const targetDate = date || today();

    console.log("📅 HR Dashboard - Target Date:", targetDate);

    // Get all sessions for the date
    const sessions = await Session.find({ date: targetDate })
      .populate("userId", "name username email")
      .sort({ startTime: 1 })
      .lean();

    console.log(`📊 HR Dashboard - Found ${sessions.length} sessions`);

    // Group sessions by user
    const userMap = {};

    sessions.forEach(session => {
      if (!session.userId) {
        console.warn("⚠️ Session without userId:", session._id);
        return;
      }

      const userId = session.userId._id.toString();
      
      if (!userMap[userId]) {
        userMap[userId] = {
          employee: {
            _id: userId,
            name: session.userId.name,
            username: session.userId.username
          },
          sessions: [],
          totalSeconds: 0,
          totalActivities: []
        };
      }

      userMap[userId].sessions.push({
        _id: session._id.toString(),
        startTime: session.startTime,
        endTime: session.endTime,
        durationSeconds: session.durationSeconds,
        status: session.status,
        activitiesCount: session.activities?.length || 0
      });

      userMap[userId].totalSeconds += session.durationSeconds || 0;
      
      // Merge activities
      if (session.activities) {
        userMap[userId].totalActivities.push(...session.activities);
      }
    });

    const dashboard = Object.values(userMap).map(user => ({
      ...user,
      productivity: calculateProductivity(user.totalActivities)
    }));

    console.log(`✅ HR Dashboard - Returning ${dashboard.length} employees`);

    return { success: true, data: dashboard };
  } catch (err) {
    console.error("HR dashboard error:", err);
    return { success: false, message: "Failed to load dashboard" };
  }
});

// -------- CALCULATE PRODUCTIVITY --------
function calculateProductivity(activities) {
  let workSeconds = 0;
  let totalSeconds = 0;

  activities.forEach(act => {
    totalSeconds += act.seconds;
    const productiveCategories = ["Development", "Design", "Communication", "Documentation"];
    if (productiveCategories.includes(act.category)) {
      workSeconds += act.seconds;
    }
  });

  return totalSeconds > 0 ? Math.round((workSeconds / totalSeconds) * 100) : 0;
}

// -------- MOUSE CLICK TRACKING --------
ipcMain.on("mouse-click", () => {
  mouseClicks++;
});

/* =====================================================
   APP LIFECYCLE
===================================================== */
app.whenReady().then(async () => {
  await connectDB();
  createWindow();
});

app.on("before-quit", async (event) => {
  if (trackingRunning && !isQuitting) {
    event.preventDefault();
    console.log("⚠️ App quitting with active session → saving...");
    isQuitting = true;
    await endSession();
    console.log("✅ Session saved");
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Emergency handlers
process.on('SIGINT', async () => {
  console.log("⚠️ SIGINT → Emergency save");
  if (trackingRunning) await endSession();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log("⚠️ SIGTERM → Emergency save");
  if (trackingRunning) await endSession();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (trackingRunning) {
    console.log("💾 Emergency save...");
    await endSession();
  }
  process.exit(1);
});