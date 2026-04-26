const redis = require("./redisClient");

// create batch
async function createBatch(batchId, total) {
  await redis.hset(`batch:${batchId}`, {
    total,
    completed: 0,
    failed: 0,
    running: 0,
  });
}

// increment running
async function markRunning(batchId) {
  await redis.hincrby(`batch:${batchId}`, "running", 1);
}

// mark completed
async function markCompleted(batchId, result) {
  await redis.hincrby(`batch:${batchId}`, "completed", 1);
  await redis.hincrby(`batch:${batchId}`, "running", -1);

  await redis.rpush(`batch:${batchId}:results`, JSON.stringify(result));
}

// mark failed
async function markFailed(batchId, error) {
  await redis.hincrby(`batch:${batchId}`, "failed", 1);
  await redis.hincrby(`batch:${batchId}`, "running", -1);

  await redis.rpush(`batch:${batchId}:results`, JSON.stringify(error));
}

// get batch
async function getBatch(batchId) {
  const data = await redis.hgetall(`batch:${batchId}`);

  if (!data || Object.keys(data).length === 0) return null;

  return {
    total: parseInt(data.total),
    completed: parseInt(data.completed),
    failed: parseInt(data.failed),
    running: parseInt(data.running),
  };
}

module.exports = {
  createBatch,
  markRunning,
  markCompleted,
  markFailed,
  getBatch,
};
