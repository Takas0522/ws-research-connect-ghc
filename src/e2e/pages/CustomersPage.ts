import type { Page, Locator } from '@playwright/test';

export class CustomersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: '顧客一覧' });
    this.addButton = page.locator('button', { hasText: '顧客追加' });
    this.tableRows = page.locator('table tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto('/customers');
    await this.heading.waitFor({ state: 'visible' });
  }

  async openAddModal(): Promise<void> {
    await this.addButton.click();
    await this.page.locator('input[name="code"]').waitFor({ state: 'visible' });
  }

  async fillCustomerForm(opts: {
    code: string;
    name: string;
    contact?: string;
  }): Promise<void> {
    await this.page.fill('input[name="code"]', opts.code);
    await this.page.fill('input[name="name"]', opts.name);
    if (opts.contact) {
      await this.page.fill('input[name="contact"]', opts.contact);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /保存/ }).click();
    await this.page.locator('input[name="code"]').waitFor({ state: 'hidden' });
  }

  async getCustomerNames(): Promise<string[]> {
    const cells = this.tableRows.locator('td:nth-child(2)');
    return cells.allTextContents();
  }
}
