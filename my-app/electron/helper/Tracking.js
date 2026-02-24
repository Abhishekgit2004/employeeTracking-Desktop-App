
const activeWin = require("active-win");
const categorize = require("./helper.js");

const Session = require("../model/Session.js");
const { extractWebsite, aggregateActivity } = require("./Activity.js");
const helperVars = require("../Variable/HelperVaribles.js");


const { startScreenshotCapture, stopScreenshotCapture } = require("./ScreenShot.js");



async function track() {
  if (!helperVars.helperVars.trackingRunning) return;

  try {
    const win = await activeWin();
    if (!win || !win.owner?.name) return;

    const now = Date.now();
    const diff = Math.floor((now - helperVars.helperVars.lastTime) / 1000);
    if (diff <= 0) return;

    helperVars.helperVars.lastTime = now;

    let appName = win.owner.name;
    let site = "-";

    // List of browsers to detect
    const browsers = ["chrome", "edge", "brave", "firefox", "safari", "opera"];
    const isBrowser = browsers.some((b) => appName.toLowerCase().includes(b));

    if (isBrowser && win.title) {
      // Extract website from browser title
      site = extractWebsite(win.title);

      // Detailed logging for debugging
      console.log("┌─── Browser Activity Detected ───");
      console.log("│ App:", appName);
      console.log("│ Raw Title:", win.title);
      console.log("│ Extracted Site:", site);
      console.log("└─────────────────────────────────");
    }

    if (helperVars.helperVars.lastApp) {
      aggregateActivity(helperVars.helperVars.lastApp, helperVars.helperVars.lastSite, diff, helperVars.helperVars.mouseClicks);
      helperVars.helperVars.mouseClicks = 0;
    }

    helperVars.helperVars.lastApp = appName;
    helperVars.helperVars.lastSite = site;
  } catch (err) {
    console.error("Tracking error:", err);
  }
}

/* =====================================================
   TRACK CONTROL
===================================================== */
function startTracking() {
  if (helperVars.helperVars.trackingInterval) return;

  helperVars.helperVars.lastTime = Date.now();
  helperVars.helperVars.lastApp = null;
  helperVars.helperVars.lastSite = null;

  helperVars.helperVars.trackingInterval = setInterval(track, 5000);
  startPeriodicSave();
  startScreenshotCapture(); // Start screenshot capture
}

function stopTracking() {
  if (helperVars.helperVars.trackingInterval) {
    clearInterval(helperVars.helperVars.trackingInterval);
    helperVars.helperVars.trackingInterval = null;
  }

  stopPeriodicSave();
  stopScreenshotCapture(); // Stop screenshot capture
  helperVars.helperVars.lastApp = null;
  helperVars.helperVars.lastSite = null;
}

async function periodicSave() {
  if (!helperVars.helperVars.trackingRunning || !helperVars.helperVars.currentSessionId || !global.CURRENT_USER_ID) {
    return;
  }

  try {
    const now = new Date();
    const durationSeconds = Math.floor((now - helperVars.helperVars.sessionStartTime) / 1000);

    console.log(`💾 Auto-saving session... (${durationSeconds} seconds)`);

    // Prepare activities with website breakdown
    const activities = Object.values(helperVars.helperVars.activityData).map((item) => {
      const categorization = categorize(item.app, item.site, item.seconds);

      const activity = {
        app: item.app,
        site: item.site,
        seconds: item.seconds,
        clicks: item.clicks,
        category: categorization.category || "Uncategorized",
        isBrowser: item.isBrowser || false,
      };

      // If this is a browser with websites, include the breakdown
      if (item.isBrowser && item.websites) {
        activity.websites = Object.entries(item.websites).map(
          ([siteName, siteData]) => ({
            site: siteName,
            seconds: siteData.seconds,
            clicks: siteData.clicks,
            category:
              categorize(item.app, siteName, siteData.seconds).category ||
              "Web Browsing",
          }),
        );
      }

      return activity;
    });

    // Update session with current data
    await Session.findByIdAndUpdate(helperVars.helperVars.currentSessionId, {
      durationSeconds,
      activities,
    });

    console.log(`💾 Auto-saved session with ${activities.length} activities`);
  } catch (err) {
    console.error("❌ Auto-save error:", err);
  }
}

function startPeriodicSave() {
  if (helperVars.helperVars.autoSaveInterval) clearInterval(helperVars.helperVars.autoSaveInterval);
  helperVars.helperVars.autoSaveInterval = setInterval(periodicSave, 2 * 60 * 1000);
  console.log("✅ Periodic auto-save started (every 2 minutes)");
}

function stopPeriodicSave() {
  if (helperVars.helperVars.autoSaveInterval) {
    clearInterval(helperVars.helperVars.autoSaveInterval);
    helperVars.helperVars.autoSaveInterval = null;
    console.log("⏹️ Periodic auto-save stopped");
  }
}

module.exports = {
  startTracking,
  stopTracking,
  track,
  startPeriodicSave,
  stopPeriodicSave,
  periodicSave,
};
