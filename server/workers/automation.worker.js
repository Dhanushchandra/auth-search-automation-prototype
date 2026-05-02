const { Worker } = require("bullmq");
const {
  markRunning,
  markCompleted,
  markFailed,
} = require("../modules/batch/batch.service.js");
const { runFlow } = require("../automation/runFlow.js");
const redis = require("../config/redis");

const worker = new Worker(
  "automation",
  async (job) => {
    console.log("🔥 JOB RECEIVED:", job.id);

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
  console.log("✅ Worker is ready and listening...");
});

worker.on("active", (job) => {
  console.log(`🚀 Job started: ${job.id}`);
});

worker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.log(`❌ Job failed: ${job.id}`);
  console.error("Error details:", err);
});

worker.on("error", (err) => {
  console.error("💥 Worker error:", err);
});
