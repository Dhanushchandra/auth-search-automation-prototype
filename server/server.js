const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Load user and profile data

const users = require("../data/users.json");
const profiles = require("../data/reqProfiles.json");
const mapPath = path.join(__dirname, "../data/userProfileMap.json");

//---MIDDLEWARE

const app = express();
app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

//-----HELPER FUNCTIONS FOR PROFILE MANAGEMENT-----

function loadMap() {
  try {
    return JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  } catch {
    return {};
  }
}

function saveMap(map) {
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
}

function pickRandomProfile() {
  return profiles[Math.floor(Math.random() * profiles.length)];
}

function getProfileById(id) {
  return profiles.find((p) => p.id === id);
}

function getProfileForUser(user, map) {
  const now = Date.now();

  const INACTIVITY_LIMIT = 15 * 60 * 1000;
  const SWITCH_COOLDOWN = 60 * 60 * 1000;

  if (!map[user.id]) {
    const profile = pickRandomProfile();

    map[user.id] = {
      profileId: profile.id,
      lastActive: now,
      lastSwitched: now,
      sessionCount: 1,
    };

    return profile;
  }

  const record = map[user.id];
  const inactiveTime = now - record.lastActive;

  record.lastActive = now;

  let profile = getProfileById(record.profileId);

  if (inactiveTime > INACTIVITY_LIMIT) {
    record.sessionCount += 1;

    const timeSinceSwitch = now - record.lastSwitched;

    if (timeSinceSwitch > SWITCH_COOLDOWN && Math.random() < 0.05) {
      const newProfile = pickRandomProfile();

      if (newProfile.id !== record.profileId) {
        record.profileId = newProfile.id;
        record.lastSwitched = now;
        profile = newProfile;
      }
    }
  }

  return profile;
}

//-----API ENDPOINTS-----

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

// app.post("/submit", async (req, res) => {
//   const { search, count } = req.body;
//   const map = loadMap();
//   const selectedUsers = users.slice(0, count);

//   const executions = selectedUsers.map((user) => ({
//     username: user.username,
//     password: user.password,
//     search,
//     context: getProfileForUser(user, map),
//   }));

//   const results = [];
//   console.log("Executions count:", executions.length);
//   for (const execData of executions) {
//     try {
//       const response = await axios.post(
//         "http://localhost:3005/run-test",
//         execData,
//       );
//       results.push(response.data);
//     } catch (err) {
//       results.push({ error: err.message });
//     }
//   }

//   // run in parallel
//   // const promises = executions.map((execData) =>
//   //   axios.post("http://localhost:3005/run-test", execData),
//   // );

//   // const results = await Promise.allSettled(promises);

//   res.json({
//     message: "Automation executed",
//     results,
//   });
// });

app.post("/submit", async (req, res) => {
  const { search, count } = req.body;

  const map = loadMap();
  const selectedUsers = users.slice(0, count);

  const executions = selectedUsers.map((user) => ({
    username: user.username,
    password: user.password,
    search,
    context: getProfileForUser(user, map),
  }));

  saveMap(map); // ✅ save once after processing all users

  const results = [];

  console.log("Executions count:", executions.length);

  // 🔹 helper sleep
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const execData of executions) {
    try {
      // random delay (500ms → 2500ms)
      const delay = Math.floor(Math.random() * 2000) + 500;
      console.log(`Waiting ${delay}ms before triggering ${execData.username}`);
      await sleep(delay);

      console.log("Triggering for:", execData.username);

      const response = await axios.post(
        "http://localhost:3005/run-test",
        execData,
      );

      results.push({
        user: execData.username,
        status: "success",
        data: response.data,
      });
    } catch (err) {
      results.push({
        user: execData.username,
        status: "failed",
        error: err.message,
      });
    }
  }

  res.json({
    message: "Automation executed",
    results,
  });
});

app.listen(3005, () => {
  console.log("Server running on http://localhost:3005");
});
