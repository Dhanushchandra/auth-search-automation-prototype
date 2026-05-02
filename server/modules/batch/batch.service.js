const redis = require("../../config/redis");

const BATCH_TTL = 60 * 60 * 24;

const getBatchKey = (batchId) => `batch:${batchId}`;
const getResultKey = (batchId) => `batch:${batchId}:results`;

async function createBatch(batchId, total) {
  await redis.hset(getBatchKey(batchId), {
    total,
    completed: 0,
    failed: 0,
    running: 0,
  });

  await redis.expire(getBatchKey(batchId), BATCH_TTL);
}

async function markRunning(batchId) {
  await redis.hincrby(getBatchKey(batchId), "running", 1);
}

async function markCompleted(batchId, result) {
  await redis.hincrby(getBatchKey(batchId), "completed", 1);
  await redis.hincrby(getBatchKey(batchId), "running", -1);

  await redis.hset(getResultKey(batchId), result.jobId, result.status);
  await redis.expire(getResultKey(batchId), BATCH_TTL);
}

async function markFailed(batchId, error) {
  await redis.hincrby(getBatchKey(batchId), "failed", 1);
  await redis.hincrby(getBatchKey(batchId), "running", -1);

  await redis.hset(
    getResultKey(batchId),
    error.jobId,
    JSON.stringify({
      status: error.status,
      error: error.error,
    }),
  );

  await redis.expire(getResultKey(batchId), BATCH_TTL);
}

async function getBatch(batchId) {
  const data = await redis.hgetall(getBatchKey(batchId));

  if (!data || Object.keys(data).length === 0) return null;

  return {
    total: +data.total,
    completed: +data.completed,
    failed: +data.failed,
    running: +data.running,
  };
}

module.exports = {
  createBatch,
  markRunning,
  markCompleted,
  markFailed,
  getBatch,
};
