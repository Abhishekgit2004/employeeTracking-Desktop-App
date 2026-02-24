


module.exports = {

  helperVars:{
 isQuitting : false,

 currentSessionId : null,
 activityData : {},
 mouseClicks : 0,
 lastApp : null,
 lastSite : null,
 lastTime : Date.now(),

 trackingInterval : null,
 trackingRunning : false,
 sessionStartTime : null,
 autoSaveInterval : null,

 SCREENSHOT_INTERVAL : 2 * 60 * 1000,
 screenshotInterval : null,
 screenshotsDir : null,

  }
}