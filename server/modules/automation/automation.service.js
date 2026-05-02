const { v4: uuidv4 } = require("uuid");
const { addAutomationJob } = require("../../queues/automation.queue");
const { createBatch } = require("../batch/jobsStore");
const User = require("../../models/User");
const { getProfileForUser } = require("../../services/profileService");

const submitAutomation = async ({ search, count }) => {
  const users = await User.find().limit(count);

  const batchId = uuidv4();

  await createBatch(batchId, users.length);

  for (const user of users) {
    const context = await getProfileForUser(user);

    const jobId = `batch_${batchId}_user_${user._id}`;

    await addAutomationJob({
      batchId,
      jobId,
      user,
      search,
      context,
    });
  }

  return {
    batchId,
    total: users.length,
  };
};

module.exports = {
  submitAutomation,
};
