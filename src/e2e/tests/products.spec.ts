import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { resetDatabase } from '../fixtures/database';

test.describe('Products', () => {
  test.beforeEach(async () => {
    await resetDatabase();
  });

  test('register new product and add plan', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();

    // Verify initial state has the seeded products
    await expect(productsPage.heading).toBeVisible();

    // Open the add product modal
    await productsPage.openAddModal();

    // Fill in the new product details
    const newProductName = 'E2Eテスト新製品';
    await productsPage.fillProductForm({
      name: newProductName,
      category: 'クラウド',
      status: 'active',
    });

    // Submit and wait for the modal to close
    await productsPage.submitForm();

    // Verify the new product appears in the list
    await expect(page.locator('table')).toContainText(newProductName);

    // Click on the new product to navigate to the detail page
    await page.locator('table tbody tr', { hasText: newProductName }).click();

    const detailPage = new ProductDetailPage(page);
    await expect(detailPage.productHeading).toContainText(newProductName);

    // Open the add plan modal
    await detailPage.openAddPlanModal();

    // Fill in the new plan details
    const newPlanName = 'E2Eテスト新プラン';
    await detailPage.fillPlanForm({ name: newPlanName, monthlyFee: '20000' });

    // Submit and wait for the modal to close
    await detailPage.submitPlanForm();

    // Verify the new plan appears in the plan list
    await expect(page.locator('table')).toContainText(newPlanName);
  });
});
