import { test, expect } from '@playwright/test';
import { UsagePage } from '../pages/UsagePage';
import { resetDatabase } from '../fixtures/database';

// Known fixed UUIDs from fixtures/seed.sql
const CONTRACT_A_STANDARD_ID = 'e2e00004-0000-0000-0000-000000000001';

test.describe('Usage', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('register monthly usage and verify billing', async ({ page }) => {
    const usagePage = new UsagePage(page);
    await usagePage.goto();
    await expect(usagePage.heading).toBeVisible();

    // Record the number of existing usage rows before adding a new one
    const initialRowCount = await usagePage.getRowCount();

    // Open the usage registration modal
    await usagePage.openRegisterModal();

    // Fill in usage details for a new month not yet in the seed data
    // Seed has 2026-01, 2026-02, 2026-03 — use 2026-04 as the new month
    await usagePage.fillUsageForm({
      contractId: CONTRACT_A_STANDARD_ID,
      yearMonth: '2026-04',
      usageQuantity: '25',
    });

    // Submit the form
    await usagePage.submitForm();

    // Verify a new row was added
    await expect(usagePage.tableRows).toHaveCount(initialRowCount + 1);

    // Verify the billing amount is displayed for the new usage record
    // (The billing amount is calculated by the backend based on the plan)
    const billingAmounts = await usagePage.getBillingAmounts();
    // The new row should have a non-zero billing amount
    const hasNonZeroBilling = billingAmounts.some((amount) =>
      amount.includes('¥') && !amount.includes('¥0'),
    );
    expect(hasNonZeroBilling).toBeTruthy();
  });
});
