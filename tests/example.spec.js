import { test, expect } from "@playwright/test";

test("API triggered flow", async ({ page }) => {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  const search = process.env.TEST_SEARCH;

  await page.goto("http://127.0.0.1:5500/client/index.html");

  await page.fill("#username", username);
  await page.fill("#password", password);
  await page.click("button[type='submit']");

  await page.fill("#searchInput", search);
  await page.click("#searchBtn");

  await expect(page.locator("#result")).toContainText(search);
});
