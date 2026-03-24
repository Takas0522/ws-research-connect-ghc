import type { Page, Locator } from '@playwright/test';

export class UsagePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly registerButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: '利用実績' });
    this.registerButton = page.locator('button', { hasText: '実績登録' });
    this.tableRows = page.locator('table tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto('/usages');
    await this.heading.waitFor({ state: 'visible' });
  }

  async openRegisterModal(): Promise<void> {
    await this.registerButton.click();
    await this.page.locator('input[name="contractId"]').waitFor({ state: 'visible' });
  }

  async fillUsageForm(opts: {
    contractId: string;
    yearMonth: string;
    usageQuantity: string;
  }): Promise<void> {
    await this.page.fill('input[name="contractId"]', opts.contractId);
    await this.page.fill('input[name="yearMonth"]', opts.yearMonth);
    await this.page.fill('input[name="usageQuantity"]', opts.usageQuantity);
  }

  async submitForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /登録/ }).click();
    await this.page.locator('input[name="contractId"]').waitFor({ state: 'hidden' });
  }

  async getBillingAmounts(): Promise<string[]> {
    const cells = this.tableRows.locator('td:last-child');
    return cells.allTextContents();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }
}
