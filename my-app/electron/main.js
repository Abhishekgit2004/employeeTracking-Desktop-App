const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const connectDB = require("./config/db.js");
const {
  Sessionget,
  SessionStart,
  SessionEnd,
  SessionStatus,
  SessionResume,
} = require("./controllers/session.controller.js");
const {
  screenShotShareEmail,
  screenShotget,
  screenshotgetfile,
  screenShortGetAll,
  screenShotOpenFLoder,
  screenShotExportDaily,
  screenShotExportZip,
} = require("./controllers/ScreenShort.controller.js");
const {ActivityCurrent} = require("./controllers/Activity.controller.js");
const {
  Login,
  Register,
  hrDashBord,
  getAllEmployee,
} = require("./controllers/user.controllers.js");
const {
  AttendanceGet,
  AttendanceSummary,
  AttendanceToday,
} = require("./controllers/Attandence.controller.js");
const { endSession } = require("./helper/session.js");
const {
  AdminUpdateUserSetting,
  AdmingetuserSetting,
  AdminDeleteScreenShot,
  AdminAddActivity,
  AdminDeleteActivity,
  AdminEditActivity,
  AdminDeleteUser,
  AdminUpdateUserRole,
  AdminGetusers,
} = require("./controllers/Admin.controller.js");
const { initScreenshotsDirectory, cleanupOldScreenshots } = require("./helper/ScreenShot.js");
/* =====================================================
   GLOBAL STATE
===================================================== */
let mainWindow;
let isQuitting = false;

// SESSION-BASED TRACKING

let mouseClicks = 0;

let trackingRunning = false;

// SCREENSHOT CONFIGURATION

const isDev = !app.isPackaged;

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
      nodeIntegration: false,
    },
  });
  // const isDev=true
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("close", async (event) => {
    if (isQuitting) return;

    if (trackingRunning) {
      event.preventDefault();

      const response = await dialog.showMessageBox(mainWindow, {
        type: "warning",
        buttons: ["Save & Quit", "Cancel"],
        defaultId: 0,
        title: "Tracking Active",
        message: "You are currently tracking time!",
        detail:
          "Closing now will save your session and stop tracking. Do you want to continue?",
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

// GET ALL USERS
ipcMain.handle("admin:getUsers", AdminGetusers);

// UPDATE USER ROLE
ipcMain.handle("admin:updateUserRole", AdminUpdateUserRole);

// DELETE USER
ipcMain.handle("admin:deleteUser", AdminDeleteUser);

// EDIT ACTIVITY
ipcMain.handle("admin:editActivity", AdminEditActivity);

// DELETE ACTIVITY
ipcMain.handle("admin:deleteActivity", AdminDeleteActivity);

// ADD MANUAL ACTIVITY
ipcMain.handle("admin:addActivity", AdminAddActivity);

// DELETE SCREENSHOT
ipcMain.handle("admin:deleteScreenshot", AdminDeleteScreenShot);

// GET USER TRACKING SETTING
ipcMain.handle("admin:getUserSettings", AdmingetuserSetting);

// UPDATE USER TRACKING SETTINGS
ipcMain.handle("admin:updateUserSettings", AdminUpdateUserSetting);
// REGISTRATION
ipcMain.handle("register", Register);

// LOGIN
ipcMain.handle("login", Login);

/* =====================================================
   ATTENDANCE IPC HANDLERS
===================================================== */

// Get attendance for specific user and date range
ipcMain.handle("attendance:get", AttendanceGet);

// Get attendance summary for HR dashboard
ipcMain.handle("attendance:summary", AttendanceSummary);

// Get today's attendance for current user
ipcMain.handle("attendance:today", AttendanceToday);

// SESSION HANDLERS
ipcMain.handle("session:start", SessionStart);

ipcMain.handle("session:stop", SessionEnd);

ipcMain.handle("session:status", SessionStatus);

ipcMain.handle("session:resume", SessionResume);

// ACTIVITY HANDLERS
ipcMain.handle("activity:current", ActivityCurrent);

ipcMain.handle("sessions:get", Sessionget);

// HR HANDLERS
ipcMain.handle("employees:getAll", getAllEmployee);

ipcMain.handle("hr:dashboard", hrDashBord);

// SCREENSHOT HANDLERS
ipcMain.handle("screenshots:get", screenShotget);

// ✅ AFTER
// ✅ FIXED - Initialize screenshotsDir if needed
ipcMain.handle("screenshots:getFile", screenshotgetfile);



/* =====================================================
   SCREENSHOT EXPORT & SHARE HANDLERS
===================================================== */

// Get all screenshots for a session (local files only)
// Get all screenshots for a session (local files only)
ipcMain.handle("screenshots:getAll", screenShortGetAll);

// Export selected screenshots to a ZIP file
ipcMain.handle("screenshots:exportZip", screenShotExportZip);

// Export daily report (all screenshots from today)
ipcMain.handle("screenshots:exportDaily", screenShotExportDaily);

// Open file location in file explorer
ipcMain.handle("screenshots:openFolder", screenShotOpenFLoder);

// Share via email (opens default email client)
ipcMain.handle("screenshots:shareEmail", screenShotShareEmail);

// MOUSE TRACKING
ipcMain.on("mouse-click", () => {
  mouseClicks++;
});

/* =====================================================
   APP LIFECYCLE
===================================================== */
app.whenReady().then(async () => {
  await connectDB();

  initScreenshotsDirectory();
  cleanupOldScreenshots(30); // Keep screenshots for 30 days
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
process.on("SIGINT", async () => {
  console.log("⚠️ SIGINT → Emergency save");
  if (trackingRunning) await endSession();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("⚠️ SIGTERM → Emergency save");
  if (trackingRunning) await endSession();
  process.exit(0);
});

process.on("uncaughtException", async (error) => {
  console.error("❌ Uncaught Exception:", error);
  if (trackingRunning) {
    console.log("💾 Emergency save...");
    await endSession();
  }
  process.exit(1);
});
  