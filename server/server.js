const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const connectDB = require("./db");
const User = require("./models/User");
const { getProfileForUser } = require("./services/profileService");

const { automationQueue } = require("./queue");
const { createBatch, getBatch } = require("./jobsStore");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

app.post("/run-test", (req, res) => {
  const { username, password, search, context } = req.body;

  exec(
    "npx playwright test",
    {
      env: {
        ...process.env,
        TEST_USERNAME: username,
        TEST_PASSWORD: password,
        TEST_SEARCH: search,
        TEST_CONTEXT: JSON.stringify(context || {}),
      },
    },
    (error, stdout, stderr) => {
      const failed = stdout.includes("failed");

      if (error || failed) {
        return res.status(500).json({
          status: "failed",
          error: error?.message,
          details: stdout || stderr,
        });
      }

      res.json({
        status: "passed",
        details: stdout,
      });
    },
  );
});

app.post("/submit", async (req, res) => {
  const { search, count } = req.body;

  const users = await User.find().limit(count);

  const batchId = uuidv4();

  await createBatch(batchId, users.length);

  for (const user of users) {
    const context = await getProfileForUser(user);

    await automationQueue.add(
      "user-automation",
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
        timeout: 60000,
        retry: 1,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }

  res.json({
    message: "Jobs queued",
    batchId,
    total: users.length,
  });
});

app.get("/status/:batchId", async (req, res) => {
  const batch = await getBatch(req.params.batchId);

  if (!batch) return res.status(404).json({ error: "Not found" });

  res.json(batch);
});

app.listen(3005, () => {
  console.log("Server running on http://localhost:3005");
});
