const mongoose = require("mongoose");
// lV6QEv4USKU9tiE1   it2_db_user
module.exports = async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/it34", {
      autoIndex: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
};
