const Attendance = require("../model/Attendance");
const { today } = require("./userService");





async function updateAttendanceOnSessionStart(sessionId, startTime) {
  try {
    const date = today();

    const attendance = await Attendance.findOneAndUpdate(
      {
        userId: global.CURRENT_USER_ID,
        date: date,
      },
      {
        $setOnInsert: {
          userId: global.CURRENT_USER_ID,
          date: date,
          firstSessionStart: startTime,
          status: "active",
        },
        $inc: { sessionsCount: 1 },
        $push: { sessionIds: sessionId },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    console.log("✅ Attendance record updated on session start");
    return attendance;
  } catch (err) {
    console.error("❌ Error updating attendance on start:", err);
    return null;
  }
}

// Update attendance when session ends
async function updateAttendanceOnSessionEnd(
  sessionId,
  endTime,
  durationSeconds,
) {
  try {
    const date = today();

    const attendance = await Attendance.findOneAndUpdate(
      {
        userId: global.CURRENT_USER_ID,
        date: date,
      },
      {
        lastSessionEnd: endTime,
        $inc: { totalWorkSeconds: durationSeconds },
        status: "completed",
      },
      {
        new: true,
      },
    );

    console.log("✅ Attendance record updated on session end");
    return attendance;
  } catch (err) {
    console.error("❌ Error updating attendance on end:", err);
    return null;
  }
}
module.exports = {
    updateAttendanceOnSessionStart,
    updateAttendanceOnSessionEnd
}