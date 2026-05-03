const fs = require("fs");
const path = require("path");
const { inspect } = require("util");

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "logs");
const LOG_LEVEL = process.env.LOG_LEVEL || "http";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const redactKeys = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "secret",
  "apiKey",
  "apikey",
  "accessToken",
  "refreshToken",
]);

fs.mkdirSync(LOG_DIR, { recursive: true });

const streams = {
  app: fs.createWriteStream(path.join(LOG_DIR, "app.log"), { flags: "a" }),
  http: fs.createWriteStream(path.join(LOG_DIR, "http.log"), { flags: "a" }),
  fingerprint: fs.createWriteStream(path.join(LOG_DIR, "fingerprint.log"), {
    flags: "a",
  }),
  behavior: fs.createWriteStream(path.join(LOG_DIR, "behavior.log"), {
    flags: "a",
  }),
};

function shouldLog(level) {
  return levels[level] <= levels[LOG_LEVEL];
}

function redact(value) {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, entryValue]) => {
    if (
      entryValue != null &&
      (redactKeys.has(key) || redactKeys.has(key.toLowerCase()))
    ) {
      acc[key] = "[REDACTED]";
      return acc;
    }

    acc[key] = redact(entryValue);
    return acc;
  }, {});
}

function normalizeError(error) {
  if (!error) return undefined;

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function serialize(level, event, payload = {}) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(payload),
  });
}

function write(streamName, level, event, payload) {
  if (!shouldLog(level)) return;

  const line = `${serialize(level, event, payload)}\n`;
  const stream = streams[streamName] || streams.app;

  stream.write(line);

  if (process.env.LOG_TO_CONSOLE !== "false") {
    const output = level === "error" ? console.error : console.log;
    output(line.trim());
  }
}

function log(level, event, payload) {
  write("app", level, event, payload);
}

module.exports = {
  debug: (event, payload) => log("debug", event, payload),
  error: (event, payload = {}) =>
    log("error", event, { ...payload, error: normalizeError(payload.error) }),
  behavior: (event, payload) => write("behavior", "info", event, payload),
  fingerprint: (event, payload) => write("fingerprint", "info", event, payload),
  http: (event, payload) => write("http", "http", event, payload),
  info: (event, payload) => log("info", event, payload),
  inspectValue: (value) => inspect(redact(value), { depth: 8, colors: false }),
  redact,
  warn: (event, payload) => log("warn", event, payload),
};
