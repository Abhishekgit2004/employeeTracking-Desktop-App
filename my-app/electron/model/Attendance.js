const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String, // Format: "YYYY-MM-DD"
      required: true
    },
    loginTime: {
      type: Date,
      required: true
    },
    logoutTime: {
      type: Date,
      default: null          // ← filled in on logout, not on login
    },
    totalSeconds: {
      type: Number,
      default: 0             // ← calculated on logout
    }
  },
  {
    timestamps: true
  }
);

// ✅ Compound index to ensure one record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
