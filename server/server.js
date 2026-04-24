const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
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

app.listen(3005, () => {
  console.log("Server running on http://localhost:3005");
});
