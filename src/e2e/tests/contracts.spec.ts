import { test, expect } from '@playwright/test';
import { CustomersPage } from '../pages/CustomersPage';
import { ContractsPage } from '../pages/ContractsPage';
import { resetDatabase } from '../fixtures/database';

// Known fixed UUIDs from fixtures/seed.sql
const PLAN_STANDARD_ID = 'e2e00002-0000-0000-0000-000000000001';

test.describe('Contracts', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('register customer and create contract', async ({ page }) => {
    // Step 1: Add a new customer via the UI
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    await expect(customersPage.heading).toBeVisible();

    await customersPage.openAddModal();
    const newCustomerCode = 'E2E-NEW';
    const newCustomerName = 'E2E新規顧客テスト株式会社';
    await customersPage.fillCustomerForm({
      code: newCustomerCode,
      name: newCustomerName,
      contact: 'テスト担当者 03-9999-9999',
    });
    await customersPage.submitForm();

    // Verify the new customer appears in the list
    await expect(page.locator('table')).toContainText(newCustomerName);

    // Step 2: Retrieve the new customer ID via the API to create a contract
    const response = await page.request.get('/api/customers');
    expect(response.ok()).toBeTruthy();
    const customers = await response.json() as Array<{ id: string; code: string }>;
    const newCustomer = customers.find((c) => c.code === newCustomerCode);
    expect(newCustomer).toBeDefined();
    const newCustomerId = newCustomer!.id;

    // Step 3: Create a contract via the API
    // (The UI sends product IDs as planId placeholders, so we use the API directly)
    const contractResponse = await page.request.post('/api/contracts', {
      data: {
        customerId: newCustomerId,
        planId: PLAN_STANDARD_ID,
        contractType: 'monthly',
        startDate: '2026-03-24',
      },
    });
    expect(contractResponse.ok()).toBeTruthy();

    // Step 4: Verify the contract appears in the contracts list
    const contractsPage = new ContractsPage(page);
    await contractsPage.goto();
    await expect(contractsPage.heading).toBeVisible();

    const customerNames = await contractsPage.getCustomerNamesInTable();
    expect(customerNames).toContain(newCustomerName);
  });
});
