const mongoose = require("mongoose");

const activityItemSchema = new mongoose.Schema(
  {
    app: {
      type: String,
      required: true
    },
    site: {
      type: String,
      default: "-"
    },
    seconds: {
      type: Number,
      required: true,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: "Uncategorized"
    }
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
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
    activities: [activityItemSchema]
  },
  {
    timestamps: true
  }
);

// ✅ Compound index to ensure one record per user per day
activitySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Activity", activitySchema);
