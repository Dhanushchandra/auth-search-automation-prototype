const { getBrowser } = require("../config/playwright.browser");
const logger = require("../utils/logger");

async function runFlow() {
  const browser = await getBrowser();

  const context = await browser.newContext();
  const page = await context.newPage();

  const inspectResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/inspect") &&
      response.request().method() === "POST",
    { timeout: 10000 },
  );

  await page.goto(
    "http://localhost:5500/server/client/index.html?query=example",
  );
  await page.waitForLoadState("load");
  const response = await inspectResponse;

  logger.info("automation.fingerprintCaptured", {
    status: response.status(),
    url: response.url(),
  });

  await context.close();

  return { status: "completed" };
}

module.exports = { runFlow };
