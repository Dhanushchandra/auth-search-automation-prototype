const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello! Use POST /run-test to execute the test.");
});

app.post("/run-test", (req, res) => {
  const { username, password, search, context } = req.body;

  // ✅ Validate input (basic)
  if (!username || !password || !search) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields",
    });
  }

  console.log("Incoming request:", { username, search, context });

  exec(
    "npx playwright test",
    {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
        TEST_USERNAME: username,
        TEST_PASSWORD: password,
        TEST_SEARCH: search,
        TEST_CONTEXT: JSON.stringify(context || {}),
      },
    },
    (error, stdout, stderr) => {
      console.log("STDOUT:\n", stdout);
      console.log("STDERR:\n", stderr);

      const passed = stdout.includes("passed");
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

app.post("/inspect", (req, res) => {
  const headers = req.headers;

  const fingerprint = {
    userAgent: headers["user-agent"],
    acceptLanguage: headers["accept-language"],
    referer: headers["referer"],
    ip: req.ip,
    forwarded: headers["x-forwarded-for"],
  };

  console.log("=== HEADERS ===");
  console.log(headers);

  console.log("=== FINGERPRINT ===");
  console.log(fingerprint);

  console.log("=== BODY ===");
  console.log(req.body);

  res.json({
    message: "Captured successfully",
    headers,
    fingerprint,
    body: req.body,
  });
});

app.listen(3005, () => {
  console.log("Server running on http://localhost:3005");
});
