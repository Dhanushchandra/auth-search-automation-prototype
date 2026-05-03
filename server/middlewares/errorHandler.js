const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  logger.error("request.failed", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    error: err,
  });

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal server error" : err.message,
    requestId: req.id,
  });
}

module.exports = errorHandler;
