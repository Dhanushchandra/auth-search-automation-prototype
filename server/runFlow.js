const { chromium } = require("playwright");
const { getBrowser } = require("./browser");

async function runFlow({ username, password, search, contextConfig }) {
  const browser = await getBrowser();
  // console.log("🚀 Starting flow for user:", username);
  // console.log("Context config:", contextConfig);
  const context = await browser.newContext({
    ...contextConfig,
  });

  await context.route("**/*", (route) => {
    if (route.request().resourceType() === "image") {
      return route.abort();
    }
    route.continue();
  });

  const page = await context.newPage();

  await page.goto("http://localhost:5500/client/index.html");

  // Login
  await page.locator("#username").pressSequentially(username, { delay: 120 });
  await page.locator("#password").pressSequentially(password, { delay: 110 });

  await page.waitForTimeout(Math.random() * 500 + 300);

  const loginBtn = page.locator("button[type='submit']");
  await loginBtn.hover();
  await loginBtn.click();

  // Search
  await page.locator("#searchInput").pressSequentially(search, {
    delay: 100 + Math.random() * 50,
  });

  await page.waitForTimeout(Math.random() * 500 + 300);

  const searchBtn = page.locator("#searchBtn");
  await searchBtn.hover();
  await searchBtn.click();

  // Validate
  await page.waitForSelector("#result");
  const resultText = await page.locator("#result").textContent();

  if (!resultText.includes(search)) {
    throw new Error("Search validation failed");
  }

  // Submit

  const submitBtn = page.locator("#submitBtn");
  await submitBtn.hover();
  await page.waitForTimeout(Math.random() * 400 + 200);
  await submitBtn.click();

  await context.close();

  return { status: "passed" };
}

module.exports = { runFlow };
