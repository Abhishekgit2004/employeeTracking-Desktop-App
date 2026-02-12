const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/employee_tracker", {
      autoIndex: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
};
