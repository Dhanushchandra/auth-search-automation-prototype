const Profile = require("../models/Profile");
const UserProfileMap = require("../models/UserProfileMap");

async function getRandomProfile() {
  const count = await Profile.countDocuments();
  const random = Math.floor(Math.random() * count);
  return await Profile.findOne().skip(random);
}

async function getProfileForUser(user) {
  const now = Date.now();

  const INACTIVITY_LIMIT = 15 * 60 * 1000;
  const SWITCH_COOLDOWN = 60 * 60 * 1000;

  let record = await UserProfileMap.findOne({ userId: user._id });

  if (!record) {
    const profile = await getRandomProfile();

    record = await UserProfileMap.create({
      userId: user._id,
      profileId: profile._id,
      lastActive: now,
      lastSwitched: now,
      sessionCount: 1,
    });

    return profile.config;
  }

  const inactiveTime = now - record.lastActive;
  record.lastActive = now;

  let profile = await Profile.findById(record.profileId);

  if (inactiveTime > INACTIVITY_LIMIT) {
    record.sessionCount += 1;

    const timeSinceSwitch = now - record.lastSwitched;

    if (timeSinceSwitch > SWITCH_COOLDOWN && Math.random() < 0.05) {
      const newProfile = await getRandomProfile();

      if (!newProfile._id.equals(record.profileId)) {
        record.profileId = newProfile._id;
        record.lastSwitched = now;
        profile = newProfile;
      }
    }
  }

  await record.save();

  return profile.config;
}

module.exports = { getProfileForUser };
