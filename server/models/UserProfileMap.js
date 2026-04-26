const mongoose = require("mongoose");

const userProfileMapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
  lastActive: Date,
  lastSwitched: Date,
  sessionCount: Number,
});

module.exports = mongoose.model("UserProfileMap", userProfileMapSchema);
