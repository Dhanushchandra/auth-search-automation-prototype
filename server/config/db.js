const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/automation");

  console.log("✅ MongoDB connected");
}

module.exports = connectDB;
