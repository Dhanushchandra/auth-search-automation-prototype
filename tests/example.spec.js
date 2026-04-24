// @ts-check
import { test, expect } from "@playwright/test";

test("full flow: login → search → final → submit", async ({ page }) => {
  // 🔹 Dynamic values (env or fallback)
  const username = process.env.USERNAME || "testuser";
  const password = process.env.PASSWORD || "testpass";
  const search = process.env.SEARCH || "playwright";

  // 1. Open login page
  await page.goto("http://127.0.0.1:5500/client/index.html");

  // 2. Fill login form
  await page.fill("#username", username);
  await page.fill("#password", password);

  // 3. Click login
  await page.click("button[type='submit']");

  // 4. Verify next page
  await expect(page).toHaveURL(/next\.html/);

  // 5. Verify login data
  await expect(page.locator("#output")).toContainText(username);
  await expect(page.locator("#output")).toContainText(password);

  // 6. Search
  await page.fill("#searchInput", search);
  await page.click("#searchBtn");

  // 7. Verify final page
  await expect(page).toHaveURL(/final\.html/);
  await expect(page.locator("#result")).toContainText(search);

  // 8. Handle alert (this is the correct validation)
  const dialogPromise = page.waitForEvent("dialog");

  await page.click("#submitBtn");

  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("Submitted successfully!");
  await dialog.accept();
});
