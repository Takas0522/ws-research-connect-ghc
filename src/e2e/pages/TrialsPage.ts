import type { Page, Locator } from '@playwright/test';

export class TrialsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly startButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'トライアル' });
    this.startButton = page.locator('button', { hasText: 'トライアル開始' });
    this.tableRows = page.locator('table tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto('/trials');
    await this.heading.waitFor({ state: 'visible' });
  }

  async openStartModal(): Promise<void> {
    await this.startButton.click();
    await this.page.locator('input[name="customerId"]').waitFor({ state: 'visible' });
  }

  async fillStartTrialForm(opts: {
    customerId: string;
    productId: string;
    startDate: string;
    endDate: string;
    restrictionLevel?: string;
  }): Promise<void> {
    await this.page.fill('input[name="customerId"]', opts.customerId);
    await this.page.fill('input[name="productId"]', opts.productId);
    await this.page.fill('input[name="startDate"]', opts.startDate);
    await this.page.fill('input[name="endDate"]', opts.endDate);
    if (opts.restrictionLevel) {
      await this.page.selectOption('select[name="restrictionLevel"]', opts.restrictionLevel);
    }
  }

  async submitStartForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /開始/ }).click();
    await this.page.locator('input[name="customerId"]').waitFor({ state: 'hidden' });
  }

  async clickConvertForRow(customerName: string): Promise<void> {
    const row = this.tableRows.filter({ hasText: customerName }).first();
    await row.locator('button', { hasText: '転換' }).click();
    await this.page.locator('input[name="planId"]').waitFor({ state: 'visible' });
  }

  async fillConvertForm(opts: {
    planId: string;
    contractType?: string;
  }): Promise<void> {
    await this.page.fill('input[name="planId"]', opts.planId);
    if (opts.contractType) {
      await this.page.selectOption('select[name="contractType"]', opts.contractType);
    }
  }

  async submitConvertForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /転換する/ }).click();
    await this.page.locator('input[name="planId"]').waitFor({ state: 'hidden' });
  }

  async getStatusForRow(customerName: string): Promise<string> {
    const row = this.tableRows.filter({ hasText: customerName }).first();
    // Status badge is in the 7th column
    return (await row.locator('td:nth-child(7)').textContent()) ?? '';
  }
}
