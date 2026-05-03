const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function connectDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/automation");

  logger.info("mongodb.connected", { database: "automation" });
}

module.exports = connectDB;
