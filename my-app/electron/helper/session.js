
const categorize = require("../helper/helper.js");

const Session = require("../model/Session.js");
const { today } = require("./userService.js");
const {startTracking, stopTracking} = require("./Tracking.js");
const helperVars = require("../Variable/HelperVaribles.js");

const { updateAttendanceOnSessionStart, updateAttendanceOnSessionEnd } = require("./Attendence.js");
async function startSession() {
  try {
    console.log("finding current user")
    if (!global.CURRENT_USER_ID) {
      return { success: false, message: "No user logged in" };
    }
    console.log("finede")

    if (helperVars.helperVars.trackingRunning) {
      return { success: false, message: "Already tracking" };
    }
    console.log("run")

    const now = new Date();
    helperVars.helperVars.sessionStartTime = now;
    helperVars.helperVars.activityData = {};

    // Create new session document
    const session = await Session.create({
      userId: global.CURRENT_USER_ID,
      date: today(),
      startTime: now,
      endTime: null,
      durationSeconds: 0,
      activities: [],
      screenshots: [],
      status: 'active'
    });

    helperVars.helperVars.currentSessionId = session._id.toString();
    helperVars.helperVars.trackingRunning = true;
    startTracking();

    // ✅ UPDATE ATTENDANCE RECORD
    await updateAttendanceOnSessionStart(session._id, now);

    console.log(`✅ New session started: ${helperVars.helperVars.currentSessionId}`);

    return {
      success: true,
      message: "Session started",
      sessionId: helperVars.helperVars.currentSessionId,
      startTime: now.toISOString()
    };

  } catch (err) {
    console.error("❌ Error starting session:", err);
    return { success: false, message: "Failed to start session" };
  }
}

async function endSession() {
  try {
    if (!helperVars.helperVars.trackingRunning || !helperVars.helperVars.currentSessionId) {
      return { success: false, message: "No active session" };
    }

    const now = new Date();
    const durationSeconds = Math.floor((now - helperVars.helperVars.sessionStartTime) / 1000);

    console.log(`📊 Ending session: ${helperVars.helperVars.currentSessionId}`);
    console.log(`⏱️ Duration: ${durationSeconds} seconds`);

    stopTracking();

    // Prepare final activities with website breakdown
    const activities = Object.values(helperVars.helperVars.activityData).map(item => {
      const categorization = categorize(item.app, item.site, item.seconds);
      
      const activity = {
        app: item.app,
        site: item.site,
        seconds: item.seconds,
        clicks: item.clicks,
        category: categorization.category || "Uncategorized",
        isBrowser: item.isBrowser || false
      };
      
      if (item.isBrowser && item.websites) {
        activity.websites = Object.entries(item.websites).map(([siteName, siteData]) => ({
          site: siteName,
          seconds: siteData.seconds,
          clicks: siteData.clicks,
          category: categorize(item.app, siteName, siteData.seconds).category || "Web Browsing"
        }));
      }
      
      return activity;
    });

    // Update session with final data
    await Session.findByIdAndUpdate(helperVars.helperVars.currentSessionId, {
      endTime: now,
      durationSeconds,
      activities,
      status: 'completed'
    });

    // ✅ UPDATE ATTENDANCE RECORD
    await updateAttendanceOnSessionEnd(helperVars.helperVars.currentSessionId, now, durationSeconds);

    console.log(`✅ Session ended with ${activities.length} activities`);

    // Clear session state
    helperVars.helperVars.currentSessionId = null;
    helperVars.helperVars.sessionStartTime = null;
    helperVars.helperVars.activityData = {};
    helperVars.helperVars.trackingRunning = false;

    return {
      success: true,
      message: "Session ended successfully",
      durationSeconds
    };

  } catch (err) {
    console.error("❌ Error ending session:", err);
    
    helperVars.helperVars.currentSessionId = null;
    helperVars.helperVars.sessionStartTime = null;
    helperVars.helperVars.activityData = {};
    helperVars.helperVars.trackingRunning = false;
    
    return { success: false, message: err.message };
  }
}




module.exports = { startSession ,endSession};