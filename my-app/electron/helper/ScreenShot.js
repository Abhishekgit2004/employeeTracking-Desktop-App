const { app, dialog, desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");
const helperVars = require("../Variable/HelperVaribles");
const Session = require("../model/Session.js");

function initScreenshotsDirectory() {
  try {
    const userDataPath = app.getPath("userData");
    helperVars.helperVars.screenshotsDir = path.join(userDataPath, "screenshots");

    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(helperVars.helperVars.screenshotsDir)) {
      fs.mkdirSync(helperVars.helperVars.screenshotsDir, { recursive: true });
      console.log("✅ Screenshots directory created:", helperVars.helperVars.screenshotsDir);
    }

    return helperVars.helperVars.screenshotsDir;
  } catch (err) {
    console.error("❌ Error creating screenshots directory:", err);
    return null;
  }
}

async function captureScreenshot() {
  if (!helperVars.helperVars.trackingRunning || !helperVars.helperVars.currentSessionId || !global.CURRENT_USER_ID) {
    console.log("⚠️ Screenshot skipped: tracking not active");
    return null;
  }

  try {
    console.log("📸 Attempting to capture screenshot...");

    // Check if desktopCapturer is available
    if (!desktopCapturer) {
      console.error("❌ desktopCapturer not available");
      return null;
    }

    // Get available sources (screens) with error handling
    let sources;
    try {
      sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1280, height: 720 },
      });
    } catch (captureError) {
      console.error("❌ Failed to get desktop sources:", captureError.message);

      // Show user-friendly error once
      if (!global.screenshotErrorShown) {
        dialog.showMessageBox(mainWindow, {
          type: "warning",
          title: "Screenshot Feature Unavailable",
          message: "Screenshots cannot be captured on this system.",
          detail:
            "The app will continue tracking activity without screenshots. This may be due to system permissions or compatibility issues.",
          buttons: ["OK"],
        });
        global.screenshotErrorShown = true;
      }

      return null;
    }

    if (!sources || sources.length === 0) {
      console.error("❌ No screen sources available");
      return null;
    }

    // Get the primary screen
    const primarySource = sources[0];

    if (!primarySource.thumbnail) {
      console.error("❌ No thumbnail available from screen source");
      return null;
    }

    const screenshot = primarySource.thumbnail;

    // Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `screenshot_${global.CURRENT_USER_ID}_${timestamp}.png`;

    // Ensure screenshots directory exists
    if (!helperVars.helperVars.screenshotsDir || !fs.existsSync(helperVars.helperVars.screenshotsDir)) {
      initScreenshotsDirectory();
    }

    const filepath = path.join(helperVars.helperVars.screenshotsDir, filename);

    // Save screenshot to file
    const buffer = screenshot.toPNG();
    fs.writeFileSync(filepath, buffer);
      console.log(helperVars.helperVars.SCREENSHOT_INTERVAL)
    console.log("✅ Screenshot saved:", filename);

    // Return screenshot metadata
    return {
      filename: filename,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("❌ Screenshot capture error:", err);

    // Show error to user (only once per session)
    if (!global.screenshotErrorShown) {
      dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Screenshot Error",
        message: "Failed to capture screenshot",
        detail: err.message,
        buttons: ["OK"],
      });
      global.screenshotErrorShown = true;
    }

    return null;
  }
}

function startScreenshotCapture() {
  if (helperVars.helperVars.screenshotInterval) {
    clearInterval(helperVars.helperVars.screenshotInterval);
  }

  // Take first screenshot immediately
  captureScreenshot().then((screenshotData) => {
    if (screenshotData && helperVars.helperVars.currentSessionId) {
      addScreenshotToSession(helperVars.helperVars.currentSessionId, screenshotData);
    }
  });
  

  // Then capture every 10 minutes
  helperVars.helperVars.screenshotInterval = setInterval(async () => {
    const screenshotData = await captureScreenshot();
    if (screenshotData && helperVars.helperVars.currentSessionId) {
      addScreenshotToSession(helperVars.helperVars.currentSessionId, screenshotData);
    }

  }, helperVars.helperVars.SCREENSHOT_INTERVAL);
    console.log(helperVars.helperVars.SCREENSHOT_INTERVAL)
  console.log("✅ Screenshot capture started (every 10 minutes)");
}

function stopScreenshotCapture() {
  if (helperVars.helperVars.screenshotInterval) {
    clearInterval(helperVars.helperVars.screenshotInterval);
    helperVars.helperVars.screenshotInterval = null;
    console.log("⏹️ Screenshot capture stopped");
  }
}

async function addScreenshotToSession(sessionId, screenshotData) {
  try {
    await Session.findByIdAndUpdate(sessionId, {
      $push: {
        screenshots: {
          filename: screenshotData.filename, // ✅ only filename
          timestamp: screenshotData.timestamp, // ✅ only timestamp
          // ✅ NO filepath - each computer builds its own path
        },
      },
    });
    console.log("📸 Screenshot added to session:", screenshotData.filename);
  } catch (err) {
    console.error("❌ Error adding screenshot to session:", err);
  }
}

function cleanupOldScreenshots(daysToKeep = 30) {
  try {
    if (!helperVars.helperVars.screenshotsDir) return;

    const files = fs.readdirSync(helperVars.helperVars.screenshotsDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach((file) => {
      const filepath = path.join(helperVars.helperVars.screenshotsDir, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old screenshots`);
    }
  } catch (err) {
    console.error("❌ Screenshot cleanup error:", err);
  }
}

module.exports = {
  initScreenshotsDirectory,
  startScreenshotCapture,
  stopScreenshotCapture,
  addScreenshotToSession,
  cleanupOldScreenshots,
};
