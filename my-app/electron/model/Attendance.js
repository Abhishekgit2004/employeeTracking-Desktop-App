const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    firstSessionStart: {
      type: Date,
      required: true,
    },
    lastSessionEnd: {
      type: Date,
      default: null,
    },
    totalWorkSeconds: {
      type: Number,
      default: 0,
    },
    sessionsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // Reference to all sessions for this day
    sessionIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session"
    }]
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);