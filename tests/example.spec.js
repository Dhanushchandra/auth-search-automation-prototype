import { test, expect } from "@playwright/test";

test("API triggered flow", async ({ browser }) => {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  const search = process.env.TEST_SEARCH;

  // ✅ Create custom context
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    locale: "en-US",
    extraHTTPHeaders: {
      "accept-language": "en-US,en;q=0.9",
    },
  });

  await context.addInitScript(() => {
    const original = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const result = original.call(this);
      result.timeZone = "Asia/Kolkata";
      return result;
    };
  });

  // ✅ Create page from this context
  const page = await context.newPage();

  await page.goto("http://localhost:5500/client/index.html");

  // Type like a human
  await page.locator("#username").pressSequentially(username, {
    delay: 120,
  });
  await page.locator("#password").pressSequentially(password, {
    delay: 110,
  });

  await page.waitForTimeout(Math.random() * 500 + 300);

  // Hover + click instead of static mouse move
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
