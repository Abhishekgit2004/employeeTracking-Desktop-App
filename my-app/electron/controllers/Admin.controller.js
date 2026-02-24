const asyncHandler = require("../utility/asyncHandler")
const helperVars = require("../Variable/HelperVaribles.js");


const path = require("path");
const fs = require("fs");

const User = require("../model/user.model.js");

const Session = require("../model/Session.js");

const Attendance = require("../model/Attendance.js");

;

const AdminUpdateUserSetting=
    asyncHandler(
        async (_, { userId, settings }) => {
          try {
            await User.findByIdAndUpdate(userId, {
              trackingSettings: {
                screenshotInterval: Number(settings.screenshotInterval) || 10,
                trackingEnabled: settings.trackingEnabled !== false,
                workHoursStart: settings.workHoursStart || "09:00",
                workHoursEnd: settings.workHoursEnd || "18:00",
              },
            });
        
            console.log(`✅ Tracking settings updated for user: ${userId}`);
            return { success: true, message: "Settings updated successfully" };
          } catch (err) {
            console.error("admin:updateUserSettings error:", err);
            return {
              success: false,
              message: "Failed to update settings: " + err.message,
            };
          }
        }
    )


const AdmingetuserSetting=
    asyncHandler(
        async (_, { userId }) => {
          try {
            const user = await User.findById(userId)
              .select("name username trackingSettings")
              .lean();
        
            if (!user) return { success: false, message: "User not found" };
        
            return {
              success: true,
              settings: user.trackingSettings || {
                screenshotInterval: 10,
                trackingEnabled: true,
                workHoursStart: "09:00",
                workHoursEnd: "18:00",
              },
            };
          } catch (err) {
            console.error("admin:getUserSettings error:", err);
            return { success: false, message: "Failed to fetch settings" };
          }
        }
    )


const AdminDeleteScreenShot=
    asyncHandler(
        async (_, { sessionId, filename }) => {
          try {
            console.log(`🗑️ Deleting screenshot: ${filename}`);
        
            // Remove from DB
            await Session.findByIdAndUpdate(sessionId, {
              $pull: { screenshots: { filename: filename } },
            });
        
            // Delete file from disk
            if (helperVars.helperVars.screenshotsDir) {
              const filepath = path.join(helperVars.helperVars.screenshotsDir, filename);
              if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`✅ Screenshot file deleted: ${filename}`);
              }
            }
        
            return { success: true, message: "Screenshot deleted" };
          } catch (err) {
            console.error("admin:deleteScreenshot error:", err);
            return {
              success: false,
              message: "Failed to delete screenshot: " + err.message,
            };
          }
        }
    )
const AdminAddActivity=
    asyncHandler(
        async (_, { sessionId, activity }) => {
          try {
            console.log(`➕ Adding activity to session ${sessionId}`);
        
            const session = await Session.findById(sessionId);
            if (!session) {
              return { success: false, message: "Session not found" };
            }
        
            session.activities.push({
              app: activity.app || "Manual Entry",
              site: activity.site || "-",
              seconds: Number(activity.seconds) || 0,
              clicks: Number(activity.clicks) || 0,
              category: activity.category || "Uncategorized",
              isBrowser: false,
            });
        
            // Recalculate total duration
            session.durationSeconds = session.activities.reduce(
              (sum, a) => sum + (a.seconds || 0),
              0,
            );
        
            session.markModified("activities");
            await session.save();
        
            console.log(`✅ Activity added to session: ${sessionId}`);
            return { success: true, message: "Activity added" };
          } catch (err) {
            console.error("admin:addActivity error:", err);
            return {
              success: false,
              message: "Failed to add activity: " + err.message,
            };
          }
        }
    )


const AdminDeleteActivity=
    asyncHandler(
         async (_, { sessionId, activityIndex }) => {
            try {
              console.log(
                `🗑️ Deleting activity ${activityIndex} from session ${sessionId}`,
              );
        
              const session = await Session.findById(sessionId);
              if (!session) {
                return { success: false, message: "Session not found" };
              }
        
              if (activityIndex < 0 || activityIndex >= session.activities.length) {
                return { success: false, message: "Activity index out of range" };
              }
        
              session.activities.splice(activityIndex, 1);
        
              // Recalculate total duration
              session.durationSeconds = session.activities.reduce(
                (sum, a) => sum + (a.seconds || 0),
                0,
              );
        
              session.markModified("activities");
              await session.save();
        
              console.log(`✅ Activity deleted from session: ${sessionId}`);
              return { success: true, message: "Activity deleted" };
            } catch (err) {
              console.error("admin:deleteActivity error:", err);
              return {
                success: false,
                message: "Failed to delete activity: " + err.message,
              };
            }
          },
    )


const AdminEditActivity=
    asyncHandler(
        async (_, { sessionId, activityIndex, updates }) => {
            try {
              console.log(
                `✏️ Editing activity ${activityIndex} in session ${sessionId}`,
              );
        
              const session = await Session.findById(sessionId);
              if (!session) {
                return { success: false, message: "Session not found" };
              }
        
              if (activityIndex < 0 || activityIndex >= session.activities.length) {
                return { success: false, message: "Activity index out of range" };
              }
        
              if (updates.seconds !== undefined) {
                session.activities[activityIndex].seconds = Number(updates.seconds);
              }
              if (updates.category !== undefined) {
                session.activities[activityIndex].category = updates.category;
              }
              if (updates.app !== undefined) {
                session.activities[activityIndex].app = updates.app;
              }
        
              session.markModified("activities");
              await session.save();
        
              console.log(`✅ Activity updated in session: ${sessionId}`);
              return { success: true, message: "Activity updated successfully" };
            } catch (err) {
              console.error("admin:editActivity error:", err);
              return {
                success: false,
                message: "Failed to edit activity: " + err.message,
              };
            }
          },
    )


const AdminDeleteUser=
    asyncHandler(
         async (_, { userId }) => {
          try {
            await User.findByIdAndDelete(userId);
            await Session.deleteMany({ userId });
            await Attendance.deleteMany({ userId });
        
            console.log(`✅ User deleted: ${userId}`);
            return { success: true, message: "User deleted successfully" };
          } catch (err) {
            console.error("admin:deleteUser error:", err);
            return { success: false, message: "Failed to delete user" };
          }
        }
    )


const AdminUpdateUserRole=
    asyncHandler(
        async (_, { userId, role }) => {
          try {
            const validRoles = ["EMPLOYEE", "HR", "ADMIN"];
            if (!validRoles.includes(role)) {
              return { success: false, message: "Invalid role" };
            }
        
            const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
              .select("name username email role")
              .lean();
        
            if (!user) return { success: false, message: "User not found" };
        
            console.log(`✅ Role updated: ${user.username} → ${role}`);
        
            return {
              success: true,
              message: `Role updated to ${role}`,
              user: { ...user, _id: user._id.toString() },
            };
          } catch (err) {
            console.error("admin:updateUserRole error:", err);
            return { success: false, message: "Failed to update role" };
          }
        }
    )



const AdminGetusers=
    asyncHandler(
        async () => {
          try {
            const users = await User.find({})
              .select("name username email role createdAt")
              .lean();
        
            return {
              success: true,
              data: users.map((u) => ({ ...u, _id: u._id.toString() })),
            };
          } catch (err) {
            console.error("admin:getUsers error:", err);
            return { success: false, message: "Failed to fetch users" };
          }
        }
    )

module.exports={AdminUpdateUserSetting,
    AdmingetuserSetting,
    AdminDeleteScreenShot,
    AdminAddActivity,
    AdminDeleteActivity,
    AdminEditActivity,
    AdminDeleteUser,
    AdminUpdateUserRole,
    AdminGetusers
}

