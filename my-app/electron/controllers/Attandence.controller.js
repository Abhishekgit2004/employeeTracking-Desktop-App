const asyncHandler = require("../utility/asyncHandler");

const Attendance = require("../model/Attendance.js");


const { today } = require("../helper/userService.js");



const AttendanceGet =
  asyncHandler(async (_, { userId, date, startDate, endDate }) => {
    try {
      const query = {};

      if (userId) {
        query.userId = userId;
      }

      if (date) {
        query.date = date;
      } else if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      console.log("📅 Attendance query:", JSON.stringify(query));

      const attendance = await Attendance.find(query)
        .populate("userId", "name username email")
        .populate("sessionIds", "startTime endTime durationSeconds")
        .sort({ date: -1 })
        .lean();

      console.log(`📊 Found ${attendance.length} attendance records`);

      return {
        success: true,
        data: attendance.map((record) => ({
          ...record,
          _id: record._id.toString(),
          userId: record.userId
            ? {
                _id: record.userId._id.toString(),
                name: record.userId.name,
                username: record.userId.username,
                email: record.userId.email,
              }
            : null,
          sessionIds: record.sessionIds.map((s) => s._id.toString()),
        })),
      };
    } catch (err) {
      console.error("Get attendance error:", err);
      return { success: false, message: "Failed to fetch attendance" };
    }
  });


const AttendanceSummary =
  asyncHandler(async (_, { date, startDate, endDate }) => {
    try {
      const query = {};

      if (date) {
        query.date = date;
      } else if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      const attendance = await Attendance.find(query)
        .populate("userId", "name username email")
        .sort({ date: -1 })
        .lean();

      return {
        success: true,
        data: attendance.map((record) => ({
          _id: record._id.toString(),
          employee: {
            _id: record.userId._id.toString(),
            name: record.userId.name,
            username: record.userId.username,
          },
          date: record.date,
          firstSessionStart: record.firstSessionStart,
          lastSessionEnd: record.lastSessionEnd,
          totalWorkSeconds: record.totalWorkSeconds,
          sessionsCount: record.sessionsCount,
          status: record.status,
        })),
      };
    } catch (err) {
      console.error("Get attendance summary error:", err);
      return { success: false, message: "Failed to fetch attendance summary" };
    }
  });


const AttendanceToday = 
  asyncHandler(async () => {
    try {
      if (!global.CURRENT_USER_ID) {
        return { success: false, message: "Not authenticated" };
      }

      const attendance = await Attendance.findOne({
        userId: global.CURRENT_USER_ID,
        date: today(),
      })
        .populate("sessionIds", "startTime endTime durationSeconds status")
        .lean();

      if (!attendance) {
        return {
          success: true,
          data: null,
          message: "No attendance record for today",
        };
      }

      return {
        success: true,
        data: {
          ...attendance,
          _id: attendance._id.toString(),
        },
      };
    } catch (err) {
      console.error("Get today's attendance error:", err);
      return { success: false, message: "Failed to fetch today's attendance" };
    }
  });


module.exports = {
  AttendanceGet,
  AttendanceSummary,
  AttendanceToday,
};
