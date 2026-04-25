import { test, expect } from "@playwright/test";

test("API triggered flow", async ({ browser }) => {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  const search = process.env.TEST_SEARCH;

  // 🔥 Parse dynamic context
  const rawContext = process.env.TEST_CONTEXT;
  let contextConfig = {};
  try {
    contextConfig = rawContext ? JSON.parse(rawContext) : {};
  } catch (e) {
    console.error("Invalid TEST_CONTEXT JSON");
  }

  // ✅ Create context dynamically
  const context = await browser.newContext({
    ...contextConfig,
  });

  const page = await context.newPage();

  await page.goto("http://localhost:5500/client/index.html");

  // Debug
  const tz = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  console.log("Browser timezone:", tz);

  // Type like a human
  await page.locator("#username").pressSequentially(username, {
    delay: 120,
  });
  await page.locator("#password").pressSequentially(password, {
    delay: 110,
  });

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

  await expect(page.locator("#result")).toContainText(search);

  // Submit
  const dialogPromise = page.waitForEvent("dialog");

  const submitBtn = page.locator("#submitBtn");
  await submitBtn.hover();
  await page.waitForTimeout(Math.random() * 400 + 200);
  await submitBtn.click();

  const dialog = await dialogPromise;
  await dialog.accept();
});
