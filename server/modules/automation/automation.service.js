const { v4: uuidv4 } = require("uuid");
const { addAutomationJob } = require("../../queues/automation.queue");
const { createBatch } = require("../batch/batch.service");

const submitAutomation = async ({ search, count }) => {
  const batchId = uuidv4();

  await createBatch(batchId, count);

  await Promise.all(
    Array.from({ length: count }).map((_, i) => {
      const jobId = `batch_${batchId}_job_${i + 1}`;

      return addAutomationJob({
        batchId,
        jobId,
        search,
      });
    }),
  );

  return {
    batchId,
    total: count,
  };
};

module.exports = {
  submitAutomation,
};
