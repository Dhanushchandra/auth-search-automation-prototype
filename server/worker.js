const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const axios = require("axios");
const { markRunning, markCompleted, markFailed } = require("./jobsStore.js");
const { runFlow } = require("./runFlow.js");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

// helper delay
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const worker = new Worker(
  "automation-queue",
  async (job) => {
    console.log("🔥 JOB RECEIVED:", job.id);

    const { batchId, execData } = job.data;

    try {
      await markRunning(batchId);

      const delay = Math.floor(Math.random() * 2000) + 500;
      console.log(
        `Delaying job ${job.id} for ${delay}ms to simulate processing time...`,
      );
      await sleep(delay);

      const result = await runFlow({
        username: execData.username,
        password: execData.password,
        search: execData.search,
        contextConfig: execData.context,
      });

      await markCompleted(batchId, {
        user: execData.username,
        status: "success",
      });

      return result;
    } catch (err) {
      await markFailed(batchId, {
        user: execData.username,
        status: "failed",
        error: err.message,
      });

      throw err;
    }
  },
  {
    connection,
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
