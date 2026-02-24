// const { endSession ,startSession} = require("../helper/session");
// const Session = require("../model/Session");
// // const { startSession } = require("../model/user.model");
// const asyncHandler = require("../utility/asyncHandler");
// const { helperVars.helperVars.currentSessionId, helperVars.helperVars.activityData } = require("../Variable/HelperVaribles");





const { startSession, endSession } = require("../helper/session.js");
const { startTracking } = require("../helper/Tracking.js");
const Session = require("../model/Session.js");
// const {SessionStart}=require("../helper/session");

const asyncHandler = require("../utility/asyncHandler.js");
const helperVars = require("../Variable/HelperVaribles.js");




const Sessionget = 
  asyncHandler(async (_, { userId, date, startDate, endDate }) => {
    try {
      const query = { userId };

      if (date) {
        query.date = date;
      } else if (startDate || endDate) {
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
        data: sessions.map((session) => ({
          ...session,
          _id: session._id.toString(),
          userId: session.userId
            ? {
                _id: session.userId._id.toString(),
                name: session.userId.name,
                username: session.userId.username,
              }
            : null,
        })),
      };
    } catch (err) {
      console.error("Get sessions error:", err);
      return { success: false, message: "Failed to fetch sessions" };
    }
  });


const SessionStart = 

     asyncHandler( async () => {
  return await startSession();
     
})




const SessionEnd=
    asyncHandler( async () => {
  return await endSession();
})


const SessionStatus =
    asyncHandler(
         async () => {
          if (helperVars.helperVars.trackingRunning && helperVars.helperVars.currentSessionId) {
            return {
              active: true,
              sessionId: helperVars.helperVars.currentSessionId,
              startTime: helperVars.helperVars.sessionStartTime.toISOString(),
            };
          }
        
          if (global.CURRENT_USER_ID) {
            try {
              const incompleteSession = await Session.findOne({
                userId: global.CURRENT_USER_ID,
                status: "active",
              }).lean();
        
              if (incompleteSession) {
                return {
                  active: false,
                  hasIncompleteSession: true,
                  sessionId: incompleteSession._id.toString(),
                  startTime: incompleteSession.startTime,
                };
              }
            } catch (err) {
              console.error("Error checking status:", err);
            }
          }
        
          return {
            active: false,
            sessionId: null,
          };
        }
    )


const SessionResume=
    asyncHandler(
        async (_, { sessionId }) => {
          try {
            const session = await Session.findById(sessionId).lean();
        
            if (!session || session.status !== "active") {
              return {
                success: false,
                message: "Session not found or already completed",
              };
            }
        console.log("resume Started")
            helperVars.helperVars.currentSessionId = sessionId;
            helperVars.helperVars.sessionStartTime = new Date(session.startTime);
            helperVars.helperVars.trackingRunning = true;
        
            helperVars.helperVars.activityData = {};
            if (session.activities && session.activities.length > 0) {
              session.activities.forEach((act) => {
                helperVars.helperVars.activityData[act.app] = {
                  app: act.app,
                  site: act.site,
                  seconds: act.seconds,
                  clicks: act.clicks,
                  isBrowser: act.isBrowser || false,
                  websites: {},
                };
        
                if (act.isBrowser && act.websites) {
                  act.websites.forEach((website) => {
                    helperVars.helperVars.activityData[act.app].websites[website.site] = {
                      site: website.site,
                      seconds: website.seconds,
                      clicks: website.clicks,
                    };
                  });
                }
              });
            }
        
            startTracking();
        
            console.log(`✅ Resumed session: ${sessionId}`);
        
            return {
              success: true,
              message: "Session resumed",
              sessionId,
              startTime: session.startTime,
            };
          } catch (err) {
            console.error("Error resuming session:", err);
            return { success: false, message: "Failed to resume session" };
          }
        }
    )


module.exports = { Sessionget,SessionStart,SessionEnd ,SessionStatus,SessionResume};
