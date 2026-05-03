const { Worker } = require("bullmq");
const {
  markRunning,
  markCompleted,
  markFailed,
} = require("../modules/batch/batch.service.js");
const { runFlow } = require("../automation/runFlow.js");
const redis = require("../config/redis");
const logger = require("../utils/logger");

const worker = new Worker(
  "automation",
  async (job) => {
    logger.info("job.received", { jobId: job.id });

    const { batchId } = job.data;

    try {
      await markRunning(batchId);

      // 👇 simplified flow
      const result = await runFlow();

      await markCompleted(batchId, {
        jobId: job.id,
        status: "success",
      });

      return result;
    } catch (err) {
      await markFailed(batchId, {
        jobId: job.id,
        status: "failed",
        error: err.message,
      });

      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  },
);

worker.on("ready", () => {
  logger.info("worker.ready", { queue: "automation" });
});

worker.on("active", (job) => {
  logger.info("job.started", { jobId: job.id });
});

worker.on("completed", (job) => {
  logger.info("job.completed", { jobId: job.id });
});

worker.on("failed", (job, err) => {
  logger.error("job.failed", { jobId: job.id, error: err });
});

worker.on("error", (err) => {
  logger.error("worker.error", { error: err });
});
