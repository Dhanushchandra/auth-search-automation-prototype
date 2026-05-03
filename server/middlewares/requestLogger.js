const { randomUUID } = require("crypto");
const logger = require("../utils/logger");

function pickHeaders(headers) {
  return logger.redact({
    accept: headers.accept,
    "accept-encoding": headers["accept-encoding"],
    "accept-language": headers["accept-language"],
    "cache-control": headers["cache-control"],
    connection: headers.connection,
    host: headers.host,
    origin: headers.origin,
    referer: headers.referer,
    "sec-ch-ua": headers["sec-ch-ua"],
    "sec-ch-ua-mobile": headers["sec-ch-ua-mobile"],
    "sec-ch-ua-platform": headers["sec-ch-ua-platform"],
    "sec-fetch-dest": headers["sec-fetch-dest"],
    "sec-fetch-mode": headers["sec-fetch-mode"],
    "sec-fetch-site": headers["sec-fetch-site"],
    "user-agent": headers["user-agent"],
    "x-forwarded-for": headers["x-forwarded-for"],
    authorization: headers.authorization,
    cookie: headers.cookie,
  });
}

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = req.get("x-request-id") || randomUUID();

  req.id = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;

    logger.http("request.completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      headers: pickHeaders(req.headers),
    });
  });

  next();
}

module.exports = {
  pickHeaders,
  requestLogger,
};
