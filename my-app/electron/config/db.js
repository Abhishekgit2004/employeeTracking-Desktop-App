const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    await mongoose.connect("mongodb+srv://ap5012759_db_user:tzDd55lCDkIJsNlM@cluster0.txnrkla.mongodb.net/?appName=Cluster0", {
      autoIndex: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
};
