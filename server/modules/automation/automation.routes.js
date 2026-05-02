const express = require("express");
const router = express.Router();

const { submitAutomation } = require("./automation.service");
const { getBatch } = require("../batch/batch.service");

router.post("/submit", async (req, res) => {
  try {
    const { search, count } = req.body;

    const result = await submitAutomation({ search, count });

    res.json({
      message: "Jobs queued",
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/status/:batchId", async (req, res) => {
  try {
    const batch = await getBatch(req.params.batchId);

    if (!batch) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: "Error fetching batch" });
  }
});

module.exports = router;
