const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  profileId: String,
  config: Object,
});

module.exports = mongoose.model("Profile", profileSchema);
