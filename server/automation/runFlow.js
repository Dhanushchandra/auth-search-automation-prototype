const { getBrowser } = require("../config/playwright.browser");
const logger = require("../utils/logger");

const INDEX_URL =
  "http://localhost:5500/server/client/index.html?query=example";

function waitForPost(page, path) {
  return page.waitForResponse(
    (response) =>
      response.url().includes(path) && response.request().method() === "POST",
    { timeout: 10000 },
  );
}

async function logCaptureResults(profile, fingerprintPromise, behaviorPromise) {
  const [fingerprint, behavior] = await Promise.all([
    fingerprintPromise,
    behaviorPromise,
  ]);

  logger.info("automation.fingerprintCaptured", {
    profile,
    status: fingerprint.status(),
    url: fingerprint.url(),
  });

  logger.info("automation.behaviorScored", {
    profile,
    status: behavior.status(),
    url: behavior.url(),
  });
}

async function likely_bot(page) {
  const fingerprintResponse = waitForPost(page, "/inspect");
  const behaviorResponse = waitForPost(page, "/behavior");

  await page.goto(INDEX_URL);
  await page.waitForLoadState("load");

  await logCaptureResults("likely_bot", fingerprintResponse, behaviorResponse);

  return { profile: "likely_bot" };
}

async function likely_human(page) {
  const fingerprintResponse = waitForPost(page, "/inspect");
  const behaviorResponse = waitForPost(page, "/behavior");

  await page.goto(INDEX_URL);
  await page.waitForLoadState("load");

  await page.mouse.move(80, 120);
  await page.mouse.move(180, 190, { steps: 8 });
  await page.mouse.move(270, 245, { steps: 10 });
  await page.waitForTimeout(350);

  await page.locator("#username").click();
  await page.locator("#username").pressSequentially("test_user", {
    delay: 90,
  });

  await page.waitForTimeout(250);
  await page.mouse.move(250, 330, { steps: 8 });
  await page.locator("#password").click();
  await page.locator("#password").pressSequentially("test_password", {
    delay: 110,
  });

  await page.waitForTimeout(400);
  await page.mouse.move(180, 425, { steps: 8 });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(250);
  await page.locator('button[type="submit"]').click();

  await logCaptureResults(
    "likely_human",
    fingerprintResponse,
    behaviorResponse,
  );

  return { profile: "likely_human" };
}

async function runFlow(profile = "likely_bot") {
  const browser = await getBrowser();

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const result =
      profile === "likely_human"
        ? await likely_human(page)
        : await likely_bot(page);

    return { status: "completed", ...result };
  } finally {
    await context.close();
  }
}

module.exports = { runFlow };
