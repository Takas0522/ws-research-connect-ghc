---
name: playwright-generate-test
description: >-
  Playwright E2E テストをシナリオ設計からコード生成・実行まで一貫して行うスキル。
  Page Object Model で保守性を高め、Testcontainers で使い捨て MongoDB を提供し
  シナリオごとに最適なシードデータを投入することで Flaky を排除する。
  src/e2e/tests/ にテストファイルを作成し、通るまで修正する。
  docs/specs/{feature}/plan/ の Acceptance Criteria がある場合はそれをシナリオの基盤とする。
  パイプライン: dev-plan → dev-implement → dev-unit-test → [playwright-generate-test]
  ⚠ このスキルは「[playwright-generate-test] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: playwright-generate-test, e2e, docs/specs.
---

# Playwright テスト生成スキル

対象機能の実装を調査し、テストシナリオの設計からコード生成・実行まで一貫して行う。
**Page Object Model (POM)** で UI 操作をカプセル化し、**Testcontainers** で
テスト実行ごとに使い捨て MongoDB コンテナを起動して、各シナリオが既知のデータ状態で
独立して実行されることを保証する。

## パイプラインにおける位置づけ

```
dev-plan → dev-implement → dev-unit-test → [playwright-generate-test]
                                                    ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **dev-implement**: 計画をもとにバックエンド・フロントエンドを実装済み
3. **dev-unit-test**: 実装に対して単体テストを構築済み
4. **このスキル (playwright-generate-test)**: 計画の Acceptance Criteria をもとに E2E テストを構築する

### Acceptance Criteria の参照

`docs/specs/{feature}/plan/` が存在する場合、各タスクファイル (`task-NN-*.md`) の
**Acceptance Criteria** セクションをテストシナリオの基盤とする。

- `AC-NN-XX` 形式の各項目を1つの `test()` ブロックに対応させる
- AC がないテストは機能調査に基づいて独自にシナリオを設計する

`{feature}` はユーザーが指定する機能ディレクトリ名（例: `saas-management-app`）。

## 呼び出し規約

> **このスキルは `[playwright-generate-test] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[playwright-generate-test] saas-management-app` | ✅ 実行する |
| `E2Eテストを作って` | ❌ 実行しない — プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[playwright-generate-test] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/` が存在する場合は AC をシナリオの基盤とする。存在しない場合は機能調査で代替する
3. `src/frontend/src/` と `src/backend/app/` に実装がない場合は、先に `[dev-implement] {feature}` を案内する

## When to Use This Skill

- 新しい画面・機能の **E2E テスト** を作成するとき
- 既存テストに **テストケースを追加** するとき
- **リグレッションテスト** を強化するとき
- **テストシナリオ設計** からコード生成までを一括で行いたいとき

## Prerequisites

- テストファイルは `src/e2e/tests/` に配置する
- ファイル命名規則: `<feature>.spec.ts`
- `@playwright/test` パッケージを使用する
- baseURL: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Frontend (`npm run dev`) と Backend (`uvicorn`) が起動済みであること

### 必要な npm パッケージ

```bash
cd src/e2e
npm install -D @testcontainers/mongodb testcontainers mongodb
```

| パッケージ | 用途 |
|-----------|------|
| `@testcontainers/mongodb` | MongoDB コンテナの起動・管理 |
| `testcontainers` | Testcontainers コアライブラリ |
| `mongodb` | テストコード内から MongoDB へシードデータを投入 |

## ディレクトリ構成

```
src/e2e/
├── playwright.config.ts          # Playwright 設定（globalSetup/globalTeardown 含む）
├── global-setup.ts               # Testcontainers MongoDB 起動 + Backend 起動
├── global-teardown.ts            # コンテナ・プロセス停止
├── fixtures/                     # シードデータ JSON
│   ├── seed-products.json
│   ├── seed-plans.json
│   ├── seed-customers.json
│   └── seed-users.json
├── helpers/
│   ├── mongodb-helper.ts         # MongoDB シード投入・クリーンアップ
│   └── auth-helper.ts            # ログイン等の認証ヘルパー
├── pages/                        # Page Object Model
│   ├── BasePage.ts               # 共通操作の基底クラス
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── ProductListPage.ts
└── tests/                        # テストファイル
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    └── product-master.spec.ts
```

## Page Object Model (POM)

複数テストで共有する画面操作を **ページクラス** にカプセル化する。
ロケーター変更時の修正箇所を 1 か所に限定し、テストの保守性を高める。

### 基底クラス (`pages/BasePage.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test'

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** 派生クラスでページ固有の URL パスを返す */
  abstract readonly path: string

  async goto(): Promise<void> {
    await this.page.goto(this.path)
  }

  /** ページ見出しのロケーター（派生クラスで上書き可能） */
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 })
  }
}
```

### ページクラスの例 (`pages/LoginPage.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  readonly path = '/login'

  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.getByLabel('メールアドレス')
    this.passwordInput = page.getByLabel('パスワード')
    this.submitButton = page.getByRole('button', { name: 'ログイン' })
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### ページクラスの例 (`pages/ProductListPage.ts`)

```typescript
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductListPage extends BasePage {
  readonly path = '/master'

  readonly table: Locator
  readonly addButton: Locator

  constructor(page: Page) {
    super(page)
    this.table = page.getByRole('table')
    this.addButton = page.getByRole('button', { name: '新規追加' })
  }

  /** テーブル行数を返す（ヘッダー行を除く） */
  get rows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.locator('th') })
  }
}
```

### POM 設計規約

| ルール | 説明 |
|--------|------|
| 1 ページ = 1 クラス | 画面（URL パス）ごとにクラスを作成する |
| ロケーターはコンストラクタで定義 | `readonly` プロパティとして宣言する |
| 操作メソッドは `async` | `login()`, `submitForm()` など意味のある名前にする |
| アサーションはテスト側に書く | ページクラスに `expect` を書かない |
| `BasePage` を継承 | 共通操作 (`goto()`, `heading`) を再利用する |

## Testcontainers による MongoDB 管理

### 設計思想

DevContainer 内の MongoDB（ポート 27017）とは **独立した使い捨てコンテナ** を
テスト実行ごとに起動する。これにより:

- 開発中のデータとテストデータが干渉しない
- テスト間でデータが残留しない（コンテナ破棄で完全クリーン）
- CI 環境でも同じ動作が保証される

### ライフサイクル

```
playwright test 起動
  │
  ├─ globalSetup (global-setup.ts)
  │    ├─ MongoDBContainer 起動 (Testcontainers)
  │    ├─ 接続文字列を環境変数 MONGO_URI に設定
  │    └─ Backend (FastAPI) を MONGO_URI 付きで起動
  │
  ├─ テストファイル実行
  │    ├─ beforeEach: コレクションクリア → シナリオ別シードデータ投入
  │    ├─ test: Page Object を使って操作・検証
  │    └─ afterEach: (明示的クリーンアップは不要 — beforeEach で上書き)
  │
  └─ globalTeardown (global-teardown.ts)
       ├─ Backend プロセス停止
       └─ MongoDBContainer 停止・破棄
```

### global-setup.ts

```typescript
import { MongoDBContainer } from '@testcontainers/mongodb'
import { ChildProcess, spawn } from 'child_process'
import { writeFileSync } from 'fs'
import path from 'path'

const STATE_FILE = path.join(__dirname, '.test-state.json')

async function globalSetup(): Promise<void> {
  // 1. MongoDB コンテナを起動
  const mongoContainer = await new MongoDBContainer('mongo:7').start()
  const mongoUri = mongoContainer.getConnectionString() + '?directConnection=true'

  // 2. Backend を起動（テスト用 MongoDB URI を渡す）
  const backend = spawn(
    'uv', ['run', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
    {
      cwd: path.resolve(__dirname, '../../backend'),
      env: { ...process.env, MONGO_URI: mongoUri },
      stdio: 'pipe',
    }
  )

  // Backend の起動完了を待機
  await waitForBackend('http://localhost:8000/docs', 30_000)

  // 3. 状態を永続化（globalTeardown で使用）
  writeFileSync(STATE_FILE, JSON.stringify({
    mongoContainerId: mongoContainer.getId(),
    backendPid: backend.pid,
    mongoUri,
  }))

  // テスト内で参照できるよう環境変数に設定
  process.env.MONGO_URI = mongoUri
}

async function waitForBackend(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch { /* Backend 未起動 — リトライ */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`Backend did not start within ${timeoutMs}ms`)
}

export default globalSetup
```

### global-teardown.ts

```typescript
import { readFileSync, unlinkSync } from 'fs'
import path from 'path'

const STATE_FILE = path.join(__dirname, '.test-state.json')

async function globalTeardown(): Promise<void> {
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))

    // Backend プロセスを停止
    if (state.backendPid) {
      process.kill(state.backendPid, 'SIGTERM')
    }

    // MongoDB コンテナは Testcontainers の Ryuk が自動停止するが、
    // 明示的に停止したい場合は docker stop を使用
    // (globalSetup のスコープ外なのでコンテナ参照は使えない)
  } finally {
    unlinkSync(STATE_FILE)
  }
}

export default globalTeardown
```

### playwright.config.ts への統合

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  fullyParallel: false,           // DB 共有のため直列実行
  retries: process.env.CI ? 2 : 0,
  workers: 1,                     // シードデータ競合を防止
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
```

## シードデータ管理

### MongoDB ヘルパー (`helpers/mongodb-helper.ts`)

```typescript
import { MongoClient, type Db } from 'mongodb'
import { readFileSync } from 'fs'
import path from 'path'

let client: MongoClient | null = null
let db: Db | null = null

/** MongoDB に接続（テストスイートで 1 回呼ぶ） */
export async function connectToTestDb(): Promise<Db> {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not set. Is globalSetup configured?')
  client = new MongoClient(uri, { directConnection: true })
  await client.connect()
  db = client.db('saas_management')
  return db
}

/** MongoDB 接続を閉じる */
export async function disconnectTestDb(): Promise<void> {
  await client?.close()
  client = null
  db = null
}

/** 指定コレクションを全件削除してシードデータを投入する */
export async function seedCollection(
  db: Db,
  collectionName: string,
  fixtureFileName: string,
): Promise<void> {
  const collection = db.collection(collectionName)
  await collection.deleteMany({})
  const filePath = path.resolve(__dirname, '..', 'fixtures', fixtureFileName)
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))
  if (data.length > 0) {
    await collection.insertMany(data)
  }
}

/** 全テスト用コレクションをクリアする */
export async function clearAllCollections(db: Db): Promise<void> {
  const collections = await db.listCollections().toArray()
  for (const col of collections) {
    await db.collection(col.name).deleteMany({})
  }
}
```

### シードデータ JSON の形式

`src/e2e/fixtures/seed-<collection>.json` に配置する。  
`docs/specs/{feature}/system/03-data-model.md` のスキーマに準拠すること。

```json
// fixtures/seed-products.json
[
  {
    "product_code": "CRM001",
    "product_name": "CloudCRM Pro",
    "category": "CRM",
    "vendor": "CloudCRM Inc.",
    "created_at": { "$date": "2026-01-01T00:00:00Z" },
    "updated_at": { "$date": "2026-01-01T00:00:00Z" }
  },
  {
    "product_code": "SYNC001",
    "product_name": "DataSync Hub",
    "category": "データ同期",
    "vendor": "DataSync Corp.",
    "created_at": { "$date": "2026-01-01T00:00:00Z" },
    "updated_at": { "$date": "2026-01-01T00:00:00Z" }
  }
]
```

## Workflow

### TODO
- [ ] Step 1: 対象機能の調査 — コードと画面を確認
- [ ] Step 2: 対象画面の確認 — Playwright CLI で要素構造を把握
- [ ] Step 3: テストシナリオとシードデータの設計
- [ ] Step 4: Page Object・シードデータ・テストコードの生成
- [ ] Step 5: テストの実行と修正
- [ ] Step 6: 最終確認 — Flaky チェック

### Step 1: 対象機能の調査（コード）

- フロントエンドの実装 (`src/frontend/src/`) を確認してコンポーネント構造・画面遷移・ユーザー操作を把握する
- バックエンド API のエンドポイント (`src/backend/main.py`, `src/backend/app/routers/`) を確認し、データフローを理解する
- 既存テスト (`src/e2e/tests/`) のパターンとカバレッジを確認する
- 既存 Page Object (`src/e2e/pages/`) を確認し、再利用可能なクラスを把握する
- データモデル (`docs/specs/{feature}/system/03-data-model.md`) と既存シードデータ (`src/e2e/fixtures/`) を確認する
- 開発計画 (`docs/specs/{feature}/plan/`) が存在する場合、各タスクの Acceptance Criteria をテストシナリオの基盤とする

### Step 2: 対象画面の確認（Playwright CLI）

Playwright CLI を使ってテスト対象の画面を実際にブラウザで開き、要素構造を確認する。

```bash
playwright-cli open http://localhost:5173
playwright-cli snapshot
playwright-cli goto http://localhost:5173/target-page
playwright-cli screenshot
```

スナップショットから以下を把握する:
- 画面に存在する要素の **ref**（要素識別子）とロール・テキスト
- フォーム入力フィールド、ボタン、リンクなどの操作可能な要素
- 動的に生成される要素（API レスポンス後に表示されるテーブル等）
- ローディング状態やエラー状態の表示

### Step 3: テストシナリオとシードデータの設計

調査結果をもとにシナリオ **と必要なシードデータ** を一緒に設計する:

- **正常系**: 主要なユーザーフロー（ページ表示、フォーム送信、データ表示）
- **異常系**: エラー状態（API エラー、バリデーションエラー、空データ）
- **境界値**: 大量データ、特殊文字入力
- **UI 状態遷移**: ローディング → 成功/失敗、モーダル開閉

シナリオフォーマット:

```
| # | シナリオ | シードデータ | ユーザー操作 | 期待結果 | 優先度 |
|---|---------|-----------|------------|---------|-------|
| 1 | 一覧表示 | seed-products.json (3件) | 一覧ページにアクセス | 3件表示 | 高 |
| 2 | 空データ | なし | 一覧ページにアクセス | "データなし" | 中 |
| 3 | 新規作成 | seed-products.json | フォーム入力→送信 | 4件目追加 | 高 |
```

### Step 4: Page Object・シードデータ・テストコードの生成

#### 4-1. Page Object の作成

対象画面の Page Object が `src/e2e/pages/` に存在しない場合は新規作成する。  
既存の Page Object がある場合は再利用・拡張する。

```typescript
// pages/ProductListPage.ts
import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductListPage extends BasePage {
  readonly path = '/master'
  readonly table: Locator
  readonly addButton: Locator

  constructor(page: Page) {
    super(page)
    this.table = page.getByRole('table')
    this.addButton = page.getByRole('button', { name: '新規追加' })
  }

  get rows(): Locator {
    return this.table.getByRole('row').filter({ hasNot: this.page.locator('th') })
  }
}
```

#### 4-2. シードデータ (JSON) の作成

シナリオで必要なデータを `fixtures/` に配置する。既存ファイルがあれば再利用する。

#### 4-3. テストコードの生成

```typescript
import { test, expect } from '@playwright/test'
import { type Db } from 'mongodb'
import { connectToTestDb, disconnectTestDb, seedCollection, clearAllCollections } from '../helpers/mongodb-helper'
import { ProductListPage } from '../pages/ProductListPage'

let db: Db

test.beforeAll(async () => {
  db = await connectToTestDb()
})

test.afterAll(async () => {
  await disconnectTestDb()
})

test.describe('製品マスタ', () => {
  test.beforeEach(async () => {
    await clearAllCollections(db)
    await seedCollection(db, 'products', 'seed-products.json')
  })

  test('製品一覧にシードデータが表示される', async ({ page }) => {
    const productList = new ProductListPage(page)

    await test.step('製品一覧ページに遷移する', async () => {
      await productList.goto()
    })

    await test.step('製品テーブルが表示される', async () => {
      await expect(productList.table).toBeVisible()
    })

    await test.step('シードデータの製品が表示される', async () => {
      await expect(page.getByText('CloudCRM Pro')).toBeVisible()
      await expect(page.getByText('DataSync Hub')).toBeVisible()
    })
  })

  test('空データ時に案内メッセージが表示される', async ({ page }) => {
    // このテスト固有: 全データクリア
    await clearAllCollections(db)

    const productList = new ProductListPage(page)
    await productList.goto()

    await expect(page.getByText('データがありません')).toBeVisible()
  })
})
```

### Step 5: テストの実行と修正

```bash
cd src/e2e && npx playwright test tests/<feature>.spec.ts
```

- **Testcontainers 起因の失敗**: Docker が動作しているか確認 (`docker ps`)。DevContainer 内で Docker-in-Docker が有効か確認する
- **データ起因の失敗**: シードデータの内容を確認・修正する。MongoDB ヘルパーのログを確認する
- **ロケーター起因の失敗**: Playwright CLI で画面を再確認し、Page Object のロケーターを修正する
- **タイミング起因の失敗**: Web-first アサーション (`toBeVisible()` 等) に置き換える

### Step 6: 最終確認

- テストを複数回実行して Flaky でないことを確認する
- Page Object のロケーターがセマンティックで特定性があるか確認する
- テスト名が明確にシナリオを表しているか確認する

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `MongoDBContainer` 起動失敗 | Docker 未稼働 / 権限不足 | `docker ps` で Docker を確認。DevContainer の Docker-in-Docker 設定を確認 |
| `page.goto` でタイムアウト | Frontend 未起動 | `cd src/frontend && npm run dev` を実行 |
| API レスポンスが 404 | Backend 未起動 or ルーター未登録 | globalSetup のログを確認。Backend の MONGO_URI が正しいか確認 |
| シードデータが反映されない | MONGO_URI 未設定 / 接続エラー | globalSetup で状態ファイルが生成されているか確認 |
| ロケーターが見つからない | 要素の aria 属性不足 | `playwright-cli snapshot` で要素構造を再確認。Page Object を修正 |
| テストが Flaky | `waitForTimeout` 使用 or 非同期処理待機不足 | Web-first アサーションに置き換え |
| テスト間でデータが残留 | `beforeEach` でクリアされていない | `clearAllCollections` が呼ばれているか確認 |
