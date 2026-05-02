const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const connectDB = require("./config/db");

const automationRoutes = require("./modules/automation/automation.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

app.use("/", automationRoutes);

app.listen(3005, () => {
  console.log("Server running on http://localhost:3005");
});
