const { Worker } = require("bullmq");
const {
  markRunning,
  markCompleted,
  markFailed,
} = require("../modules/batch/batch.service.js");
const { runFlow } = require("../automation/runFlow.js");
const redis = require("../config/redis");
const logger = require("../utils/logger");

const jobStartTimes = new Map();

function getJobDurationMs(jobId) {
  const startedAt = jobStartTimes.get(jobId);

  if (!startedAt) {
    return undefined;
  }

  jobStartTimes.delete(jobId);
  return Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
}

function workerLog(payload = {}) {
  return {
    service: "worker",
    ...payload,
  };
}

const worker = new Worker(
  "automation",
  async (job) => {
    logger.info(
      "job.received",
      workerLog({ jobId: job.id, batchId: job.data.batchId }),
    );

    const { batchId } = job.data;

    try {
      await markRunning(batchId);

      // 👇 simplified flow
      const result = await runFlow("likely_human");

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
  logger.info("worker.ready", workerLog({ queue: "automation" }));
});

worker.on("active", (job) => {
  jobStartTimes.set(job.id, process.hrtime.bigint());

  logger.info(
    "job.started",
    workerLog({ jobId: job.id, batchId: job.data.batchId }),
  );
});

worker.on("completed", (job) => {
  logger.info(
    "job.completed",
    workerLog({
      jobId: job.id,
      batchId: job.data.batchId,
      durationMs: getJobDurationMs(job.id),
    }),
  );
});

worker.on("failed", (job, err) => {
  logger.error(
    "job.failed",
    workerLog({
      jobId: job?.id,
      batchId: job?.data?.batchId,
      durationMs: job ? getJobDurationMs(job.id) : undefined,
      error: err,
    }),
  );
});

worker.on("error", (err) => {
  logger.error("worker.error", workerLog({ error: err }));
});
