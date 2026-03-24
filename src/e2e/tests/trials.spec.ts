import { test, expect } from '@playwright/test';
import { TrialsPage } from '../pages/TrialsPage';
import { ContractsPage } from '../pages/ContractsPage';
import { resetDatabase } from '../fixtures/database';

// Known fixed UUIDs from fixtures/seed.sql
const CUSTOMER_A_ID = 'e2e00003-0000-0000-0000-000000000001';
const PRODUCT_ALPHA_ID = 'e2e00001-0000-0000-0000-000000000001';
const PLAN_BETA_STANDARD_ID = 'e2e00002-0000-0000-0000-000000000003';

// Customer B has a seeded active trial for Product Beta.
// Customer A has no active trial for Product Alpha (used for the "start trial" test).
const CUSTOMER_A_NAME = 'E2Eテスト顧客A';
const CUSTOMER_B_NAME = 'E2Eテスト顧客B';

test.describe('Trials', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('start trial and verify in list', async ({ page }) => {
    const trialsPage = new TrialsPage(page);
    await trialsPage.goto();
    await expect(trialsPage.heading).toBeVisible();

    // Record the number of existing trials (seed has 1 active trial for Customer B)
    const initialCount = await trialsPage.tableRows.count();

    // Start a new trial for Customer A + Product Alpha
    // (No existing active trial for this combination in the seed)
    await trialsPage.openStartModal();
    await trialsPage.fillStartTrialForm({
      customerId: CUSTOMER_A_ID,
      productId: PRODUCT_ALPHA_ID,
      startDate: '2026-03-24',
      endDate: '2026-06-30',
      restrictionLevel: 'full',
    });
    await trialsPage.submitStartForm();

    // Verify a new trial row was added
    await expect(trialsPage.tableRows).toHaveCount(initialCount + 1);

    // Verify the new trial for Customer A appears in the list
    await expect(page.locator('table')).toContainText(CUSTOMER_A_NAME);
  });

  test('convert trial to contract', async ({ page }) => {
    const trialsPage = new TrialsPage(page);
    await trialsPage.goto();
    await expect(trialsPage.heading).toBeVisible();

    // The seed has an active trial for Customer B + Product Beta
    await expect(page.locator('table')).toContainText(CUSTOMER_B_NAME);

    // Click the convert button for Customer B's trial
    await trialsPage.clickConvertForRow(CUSTOMER_B_NAME);

    // Fill in the conversion form with the Beta Standard plan
    await trialsPage.fillConvertForm({
      planId: PLAN_BETA_STANDARD_ID,
      contractType: 'monthly',
    });
    await trialsPage.submitConvertForm();

    // Verify the trial status changed to "転換済" in the list
    const status = await trialsPage.getStatusForRow(CUSTOMER_B_NAME);
    expect(status).toContain('転換済');

    // Verify the new contract appears in the contracts list
    const contractsPage = new ContractsPage(page);
    await contractsPage.goto();
    await expect(contractsPage.heading).toBeVisible();

    const customerNames = await contractsPage.getCustomerNamesInTable();
    expect(customerNames).toContain(CUSTOMER_B_NAME);
  });
});
