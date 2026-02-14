const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
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
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    activities: [
      {
        app: String,
        site: String,
        seconds: Number,
        clicks: Number,
        category: String,
        isBrowser: {
          type: Boolean,
          default: false,
        },
        websites: [
          {
            site: String,
            seconds: Number,
            clicks: Number,
            category: String,
          },
        ],
      },
    ],
    // ✅ NEW: Screenshots array
    screenshots: [
      {
        filename: String,
        filepath: String,
        timestamp: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
sessionSchema.index({ userId: 1, date: 1 });
sessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Session", sessionSchema);