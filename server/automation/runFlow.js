const { getBrowser } = require("../config/playwright.browser");

async function runFlow() {
  const browser = await getBrowser();

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:5500/server/client/index.html");

  // optional: wait a bit to ensure page loads
  await page.waitForLoadState("load");

  await context.close();

  return { status: "completed" };
}

module.exports = { runFlow };
