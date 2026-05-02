const { Queue } = require("bullmq");
const redis = require("../config/redis");

const automationQueue = new Queue("automation", {
  connection: redis,
});

const addAutomationJob = async ({ batchId, jobId, user, search, context }) => {
  await automationQueue.add(
    "users-automation",
    {
      batchId,
      execData: {
        username: user.username,
        password: user.password,
        search,
        context,
      },
    },
    {
      jobId,
      timeout: 60000,
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );

  await redis.sadd(`batch:${batchId}:jobs`, jobId);
  await redis.expire(`batch:${batchId}:jobs`, 60 * 60 * 24);
};

module.exports = {
  addAutomationJob,
};
