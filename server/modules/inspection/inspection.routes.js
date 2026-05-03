const express = require("express");
const logger = require("../../utils/logger");
const { pickHeaders } = require("../../middlewares/requestLogger");

const router = express.Router();

function normalizeClientFingerprint(body) {
  return logger.redact({
    query: body.query,
    page: body.page,
    event: body.event,
    timestamp: body.timestamp,
    screen: body.screen,
    viewport: body.viewport,
    navigator: body.navigator,
    timezone: body.timezone,
  });
}

router.post("/inspect", (req, res) => {
  const fingerprint = normalizeClientFingerprint(req.body || {});

  logger.fingerprint("fingerprint.captured", {
    requestId: req.id,
    ip: req.ip,
    serverVisible: {
      headers: pickHeaders(req.headers),
      method: req.method,
      path: req.originalUrl,
    },
    clientVisible: fingerprint,
  });

  res.json({
    ok: true,
    requestId: req.id,
    captured: {
      serverHeaders: true,
      clientFingerprint: true,
    },
  });
});

module.exports = router;
