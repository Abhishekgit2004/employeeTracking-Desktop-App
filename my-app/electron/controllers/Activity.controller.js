const asyncHandler = require("../utility/asyncHandler");


const helperVars = require("../Variable/HelperVaribles.js");


const categorize = require("../helper/helper.js");




const ActivityCurrent=
    asyncHandler(async () => {
      try {
        if (!helperVars.helperVars.trackingRunning || !helperVars.helperVars.currentSessionId) {
          return { success: false, message: "No active session" };
        }
    
        const activities = Object.values(helperVars.helperVars.activityData).map((item) => {
          const activity = {
            app: item.app,
            site: item.site,
            seconds: item.seconds,
            clicks: item.clicks,
            category:
              categorize(item.app, item.site, item.seconds).category ||
              "Uncategorized",
            isBrowser: item.isBrowser || false,
          };
    
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
    
        return {
          success: true,
          activities,
          isLive: true,
        };
      } catch (err) {
        console.error("Get current activity error:", err);
        return { success: false, message: "Failed to fetch current activity" };
      }
    })


module.exports={ActivityCurrent}