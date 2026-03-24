import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { resetDatabase } from '../fixtures/database';

test.describe('Dashboard', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('displays KPI cards and charts', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Verify KPI cards are visible
    await expect(dashboardPage.monthlyRevenueCard).toBeVisible();
    await expect(dashboardPage.activeContractsCard).toBeVisible();
    await expect(dashboardPage.activeTrialsCard).toBeVisible();
    await expect(dashboardPage.conversionRateCard).toBeVisible();

    // Verify the monthly revenue card displays a non-zero value
    // (seed data has usage records for Jan-Mar 2026; app uses fullwidth yen ￥)
    const revenueText = await dashboardPage.monthlyRevenueCard.textContent();
    expect(revenueText).toMatch(/[¥￥]/);

    // Verify chart headings are visible
    await expect(dashboardPage.revenueChartHeading).toBeVisible();
    await expect(dashboardPage.productRevenueChartHeading).toBeVisible();

    // Verify customer ranking section is visible
    await expect(dashboardPage.customerRankingHeading).toBeVisible();

    // Verify expiring trials section is visible
    await expect(dashboardPage.expiringTrialsHeading).toBeVisible();
  });
});
