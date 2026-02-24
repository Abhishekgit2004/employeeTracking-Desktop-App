// // const { model } = require("mongoose");
// const { initScreenshotsDirectory } = require("../helper/ScreenShot");
// const asyncHandler = require("../utility/asyncHandler")

const path = require("path");
const fs = require("fs");

const Session = require("../model/Session.js");

const { shell } = require("electron");
const asyncHandler = require("../utility/asyncHandler.js");
const helperVars = require("../Variable/HelperVaribles.js");

const { initScreenshotsDirectory } = require("../helper/ScreenShot.js");

const screenShortGetAll = 
  asyncHandler(async (_, { sessionId }) => {
    try {
      // Ensure screenshotsDir is initialized
   if (!helperVars.helperVars.screenshotsDir) {
  helperVars.helperVars.screenshotsDir = initScreenshotsDirectory();
}

      const session = await Session.findById(sessionId)
        .select("screenshots userId date")
        .lean();

      if (!session) {
        return { success: false, message: "Session not found" };
      }

      if (!session.screenshots || session.screenshots.length === 0) {
        return {
          success: true,
          screenshots: [],
          sessionDate: session.date,
        };
      }

      // Filter only screenshots that exist locally
      const availableScreenshots = [];

      for (const screenshot of session.screenshots) {
        if (!screenshot.filename) continue;

     const filepath = path.join(helperVars.helperVars.screenshotsDir, screenshot.filename);

        if (fs.existsSync(filepath)) {
          const stats = fs.statSync(filepath);
          availableScreenshots.push({
            filename: screenshot.filename,
            timestamp: screenshot.timestamp,
            size: stats.size,
            exists: true,
          });
        } else {
          console.log(`⚠️ Screenshot missing: ${screenshot.filename}`);
        }
      }

      console.log(
        `📸 Found ${availableScreenshots.length}/${session.screenshots.length} screenshots locally`,
      );

      return {
        success: true,
        screenshots: availableScreenshots,
        sessionDate: session.date,
      };
    } catch (err) {
      console.error("Get all screenshots error:", err);
      return {
        success: false,
        message: "Failed to fetch screenshots: " + err.message,
      };
    }
  });


const screenShotShareEmail = 
  asyncHandler(async (_, { zipPath }) => {
    try {
      if (!fs.existsSync(zipPath)) {
        return { success: false, message: "File not found" };
      }

      // Open default email with attachment
      const subject = encodeURIComponent("Daily Screenshots Report");
      const body = encodeURIComponent(
        "Please find attached my daily screenshots report.",
      );

      // Different approaches for different platforms
      if (process.platform === "win32") {
        shell.openExternal(`mailto:?subject=${subject}&body=${body}`);
        shell.showItemInFolder(zipPath);
      } else if (process.platform === "darwin") {
        // macOS
        require("child_process").exec(
          `open "mailto:?subject=${subject}&body=${body}"`,
        );
        shell.showItemInFolder(zipPath);
      } else {
        // Linux
        shell.openExternal(`mailto:?subject=${subject}&body=${body}`);
        shell.showItemInFolder(zipPath);
      }

      return {
        success: true,

        message: "Email client opened. Please attach the file manually.",
      };
    } catch (err) {
      console.error("Share email error:", err);
      return { success: false, message: "Failed to open email client" };
    }
  });


const screenShotOpenFLoder = 
  asyncHandler(async () => {
    try {
   if (!helperVars.helperVars.screenshotsDir || !fs.existsSync(helperVars.helperVars.screenshotsDir)) {
        return { success: false, message: "Screenshots folder not found" };
      }

      shell.openPath(helperVars.helperVars.screenshotsDir);
      return { success: true };
    } catch (err) {
      console.error("Open folder error:", err);
      return { success: false, message: "Failed to open folder" };
    }
  });

const screenShotExportDaily = 
  asyncHandler(async () => {
    try {
      if (!global.CURRENT_USER_ID) {
        return { success: false, message: "Not authenticated" };
      }

      const today = new Date().toISOString().split("T")[0];

      // Get today's sessions
      const sessions = await Session.find({
        userId: global.CURRENT_USER_ID,
        date: today,
      })
        .select("screenshots")
        .lean();

      if (!sessions || sessions.length === 0) {
        return { success: false, message: "No sessions found for today" };
      }

      // Collect all screenshot filenames
      const allFilenames = [];
      sessions.forEach((session) => {
        session.screenshots.forEach((screenshot) => {
          allFilenames.push(screenshot.filename);
        });
      });

      if (allFilenames.length === 0) {
        return { success: false, message: "No screenshots captured today" };
      }

      // Create ZIP
      const archiver = require("archiver");
      const { app } = require("electron");

      const exportsDir = path.join(app.getPath("userData"), "exports");
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const zipFilename = `daily_report_${today}_${Date.now()}.zip`;
      const zipPath = path.join(exportsDir, zipFilename);

      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on("close", () => {
          resolve({
            success: true,
            zipPath: zipPath,
            zipFilename: zipFilename,
            count: allFilenames.length,
            size: archive.pointer(),
          });
        });

        archive.on("error", (err) => {
          reject({ success: false, message: err.message });
        });

        archive.pipe(output);

        // Add all screenshots
        allFilenames.forEach((filename) => {
          const filepath = path.join(helperVars.helperVars.screenshotsDir, filename);
          if (fs.existsSync(filepath)) {
            archive.file(filepath, { name: filename });
          }
        });

        archive.finalize();
      });
    } catch (err) {
      console.error("Export daily error:", err);
      return { success: false, message: "Failed to export: " + err.message };
    }
  });


const screenShotExportZip = 
  asyncHandler(async (_, { filenames, sessionDate }) => {
    try {
      const archiver = require("archiver");
      const { app } = require("electron");

      // Create export directory
      const exportsDir = path.join(app.getPath("userData"), "exports");
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const zipFilename = `screenshots_${sessionDate}_${Date.now()}.zip`;
      const zipPath = path.join(exportsDir, zipFilename);

      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on("close", () => {
          console.log(`✅ ZIP created: ${archive.pointer()} bytes`);
          resolve({
            success: true,
            zipPath: zipPath,
            zipFilename: zipFilename,
            size: archive.pointer(),
          });
        });

        archive.on("error", (err) => {
          reject({ success: false, message: err.message });
        });

        archive.pipe(output);

        // Add selected screenshots to ZIP
        filenames.forEach((filename) => {
          const filepath = path.join(helperVars.helperVars.screenshotsDir, filename);
          if (fs.existsSync(filepath)) {
            archive.file(filepath, { name: filename });
          }
        });

        archive.finalize();
      });
    } catch (err) {
      console.error("Export ZIP error:", err);
      return {
        success: false,
        message: "Failed to create ZIP: " + err.message,
      };
    }
  });


const screenshotgetfile = 
  asyncHandler(async (_, { filename }) => {
    try {
      // Ensure screenshotsDir is initialized
      if (!helperVars.helperVars.screenshotsDir) {
        helperVars.helperVars.screenshotsDir = initScreenshotsDirectory();
      }

      // Validate inputs
      if (!helperVars.helperVars.screenshotsDir || !fs.existsSync(helperVars.helperVars.screenshotsDir)) {
        return {
          success: false,
          message: "Screenshots directory not available",
        };
      }

      if (!filename || typeof filename !== "string") {
        return {
          success: false,
          message: "Invalid filename",
        };
      }

      // Build filepath
      const filepath = path.join(helperVars.helperVars.screenshotsDir, filename);

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        console.log(`⚠️ Screenshot not found: ${filepath}`);
        return {
          success: false,
          message: "Screenshot file not found",
        };
      }

      // Read and convert to base64
      const buffer = fs.readFileSync(filepath);
      const base64 = buffer.toString("base64");

      console.log(`✅ Screenshot loaded: ${filename}`);

      return {
        success: true,
        data: `data:image/png;base64,${base64}`,
      };
    } catch (err) {
      console.error("Get screenshot file error:", err);
      return {
        success: false,
        message: "Failed to load screenshot: " + err.message,
      };
    }
  });


const screenShotget = 
  asyncHandler(async (_, { sessionId }) => {
    try {
      const session = await Session.findById(sessionId)
        .select("screenshots")
        .lean();

      if (!session) {
        return { success: false, message: "Session not found" };
      }

      return {
        success: true,
        screenshots: session.screenshots || [],
      };
    } catch (err) {
      console.error("Get screenshots error:", err);
      return { success: false, message: "Failed to fetch screenshots" };
    }
  });


module.exports = {
  screenShortGetAll,
  screenShotShareEmail,
  screenShotOpenFLoder,
  screenShotExportDaily,
  screenShotExportZip,
  screenshotgetfile,
  screenShotget,
};
