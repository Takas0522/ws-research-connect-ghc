import { test, expect } from "@playwright/test";

test("homepage loads and displays title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Research Connect");
});

test("weather forecast table loads from API", async ({ page }) => {
  await page.goto("/");
  // Wait for the table to appear (API response)
  const table = page.locator("table");
  await expect(table).toBeVisible({ timeout: 10_000 });
  // Should have 5 forecast rows
  const rows = table.locator("tbody tr");
  await expect(rows).toHaveCount(5);
});
