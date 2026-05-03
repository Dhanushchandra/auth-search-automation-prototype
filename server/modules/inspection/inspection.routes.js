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

function normalizeBehavior(body) {
  return logger.redact({
    page: body.page,
    event: body.event,
    timestamp: body.timestamp,
    sessionMs: body.sessionMs,
    mouse: body.mouse,
    scroll: body.scroll,
    keyboard: body.keyboard,
    pointer: body.pointer,
    focus: body.focus,
    visibility: body.visibility,
    form: body.form,
  });
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreBehavior(behavior) {
  let score = 50;
  const reasons = [];
  const sessionMs = behavior.sessionMs || 0;
  const mouseMoves = behavior.mouse?.moves || 0;
  const mouseDistance = behavior.mouse?.distancePx || 0;
  const scrollEvents = behavior.scroll?.events || 0;
  const keyEvents = behavior.keyboard?.keyEvents || 0;
  const typedFields = behavior.keyboard?.typedFields || 0;
  const clickEvents = behavior.pointer?.clicks || 0;
  const pointerDowns = behavior.pointer?.pointerDowns || 0;
  const maxScrollDepth = behavior.scroll?.maxDepthRatio || 0;
  const averageKeyIntervalMs = behavior.keyboard?.averageKeyIntervalMs;

  if (sessionMs < 1200) {
    score += 25;
    reasons.push("very_short_session");
  } else if (sessionMs > 5000) {
    score -= 10;
    reasons.push("longer_session");
  }

  if (mouseMoves === 0 && scrollEvents === 0 && keyEvents === 0) {
    score += 35;
    reasons.push("no_interaction");
  }

  if (mouseMoves > 8 && mouseDistance > 250) {
    score -= 18;
    reasons.push("natural_mouse_activity");
  }

  if (scrollEvents > 0 && maxScrollDepth > 0.05) {
    score -= 10;
    reasons.push("scroll_activity");
  }

  if (keyEvents > 0 && typedFields > 0) {
    score -= 15;
    reasons.push("typing_activity");
  }

  if (averageKeyIntervalMs && averageKeyIntervalMs < 35 && keyEvents > 8) {
    score += 20;
    reasons.push("unnaturally_fast_typing");
  }

  if (clickEvents === 0 && pointerDowns === 0 && sessionMs > 3000) {
    score += 12;
    reasons.push("no_pointer_actions");
  }

  return {
    score: clampScore(score),
    classification:
      score >= 75 ? "likely_bot" : score >= 45 ? "uncertain" : "likely_human",
    reasons,
  };
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

router.post("/behavior", (req, res) => {
  const behavior = normalizeBehavior(req.body || {});
  const result = scoreBehavior(behavior);

  logger.behavior("behavior.scored", {
    requestId: req.id,
    ip: req.ip,
    serverVisible: {
      headers: pickHeaders(req.headers),
      method: req.method,
      path: req.originalUrl,
    },
    behavior,
    botScore: result.score,
    classification: result.classification,
    reasons: result.reasons,
  });

  res.json({
    ok: true,
    requestId: req.id,
    botScore: result.score,
    classification: result.classification,
    reasons: result.reasons,
  });
});

module.exports = router;
