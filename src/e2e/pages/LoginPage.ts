import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator
  readonly heading: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByLabel('メールアドレス')
    this.passwordInput = page.getByLabel('パスワード')
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
    this.errorMessage = page.getByRole('alert')
    this.heading = page.getByRole('heading', { name: 'SaaS管理アプリ' })
  }

  get path(): string {
    return '/login'
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }
}
