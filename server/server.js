const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const { requestLogger } = require("./middlewares/requestLogger");

const automationRoutes = require("./modules/automation/automation.routes");
const inspectionRoutes = require("./modules/inspection/inspection.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "64kb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestLogger);

connectDB().catch((error) => {
  logger.error("mongodb.connection.failed", { error });
});

app.use("/", automationRoutes);
app.use("/", inspectionRoutes);
app.use(errorHandler);

app.listen(3005, () => {
  logger.info("server.started", { url: "http://localhost:3005" });
});
