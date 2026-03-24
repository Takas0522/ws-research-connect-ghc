import { test, expect } from "@playwright/test";

test("homepage loads and displays dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Dashboard");
});
