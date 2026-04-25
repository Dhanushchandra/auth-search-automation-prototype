const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello! Use POST /run-test to execute the test.");
});

app.post("/run-test", (req, res) => {
  const { username, password, search } = req.body;

  const command = `npx cross-env TEST_USERNAME="${username}" TEST_PASSWORD="${password}" TEST_SEARCH="${search}" playwright test`;

  console.log("Running command:", command); // 👈 debug log

  exec(command, { cwd: __dirname + "/.." }, (error, stdout, stderr) => {
    const passed = stdout.includes("passed");
    const failed = stdout.includes("failed");

    if (error || failed) {
      return res.status(500).json({
        status: "failed",
        details: stdout || stderr,
      });
    }

    res.json({
      status: "passed",
      details: stdout,
    });
  });
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
