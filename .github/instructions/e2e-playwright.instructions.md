---
description: 'Playwright E2E テストのベストプラクティス（Testcontainers 統合）'
applyTo: 'src/e2e/**'
---

# Playwright E2E テストガイドライン

本プロジェクトは Playwright + TypeScript + Testcontainers で E2E テストを実行する。
各テストシナリオは Testcontainers で起動した専用 PostgreSQL コンテナにシードデータを投入した状態で実行され、テスト間のデータ干渉を排除して Flaky テストを防止する。

## Testcontainers によるデータ管理

### アーキテクチャ

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│  Playwright  │────▶│   Frontend   │────▶│   Backend (ASP.NET)     │
│  (テスト)     │     │  (Vite dev)  │     │   ConnectionString は   │
└──────────────┘     └──────────────┘     │   Testcontainers が     │
                                          │   動的に設定            │
       ┌──────────────────────────────────▶└─────────────────────────┘
       │                                            │
       │  globalSetup / fixture                     │
       │  でコンテナ起動・シード投入                     ▼
       │                                  ┌─────────────────────────┐
       └──────────────────────────────────│  PostgreSQL             │
                                          │  (Testcontainers)       │
                                          │  シナリオ毎にリストア     │
                                          └─────────────────────────┘
```

### 基本方針

- `@testcontainers/postgresql` で PostgreSQL コンテナをテストプロセス内で起動する
- `globalSetup` でコンテナ起動 → スキーマ作成 → ベースシードデータ投入 → **スナップショット取得**
- 各テストシナリオの `beforeEach` で **スナップショットからリストア** し、必要に応じてシナリオ固有のシードを追加投入する
- テスト終了後にコンテナは自動破棄される
- バックエンドの接続文字列は環境変数 `ConnectionStrings__DefaultConnection` で動的に上書きする

### スナップショットの活用

Testcontainers PostgreSQL のスナップショット機能でベース状態を保存・復元する。
これによりシナリオ毎のDB再作成コストを削減し、高速かつ確実にクリーンな状態を得る。

```typescript
// スナップショット取得（globalSetup で1回）
await container.snapshot();

// スナップショット復元（各シナリオの beforeEach で）
await container.restoreSnapshot();
```

**注意**: スナップショットを使用する場合、コンテナのデータベース名に `"postgres"` を指定してはならない。

### シードデータ

- ベースシードデータ: `src/e2e/fixtures/seed.sql` — 全シナリオ共通の初期データ
- シナリオ固有シードデータ: `src/e2e/fixtures/<scenario>.sql` — 特定シナリオ専用のデータ
- シードデータは冪等に設計する（`INSERT ... ON CONFLICT DO NOTHING` 等）

### globalSetup パターン

```typescript
// global-setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:17')
    .withDatabase('appdb_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  // スキーマ適用
  const client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  const schema = fs.readFileSync(
    path.resolve(__dirname, '../../database/init/001_init.sql'), 'utf-8'
  );
  await client.query(schema);

  // ベースシードデータ投入
  const seed = fs.readFileSync(
    path.resolve(__dirname, 'fixtures/seed.sql'), 'utf-8'
  );
  await client.query(seed);
  await client.end();

  // スナップショット取得
  await container.snapshot();

  // バックエンド用の接続文字列を環境変数に設定
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.TESTCONTAINERS_CONTAINER_ID = container.getId();
}
```

## テスト構造

- import は `import { test, expect } from '@playwright/test';` を使用する
- 関連テストは `test.describe()` ブロックでグループ化する
- `test.step()` でインタラクションをグループ化してレポートの可読性を向上させる
- テスト名は `Feature - 具体的なアクションまたはシナリオ` の命名規則に従う

## ロケーター

ロケーターは以下の優先順位で選択する:

| 優先度 | ロケーター | 用途 |
|---|---|---|
| 1 (最優先) | `getByRole` | ボタン、リンク、見出し等 |
| 2 | `getByLabel` | フォーム入力要素 |
| 3 | `getByText` | テキストコンテンツ |
| 4 | `getByPlaceholder` | プレースホルダー付き入力 |
| 5 | `data-testid` | 上記が使えない場合のみ |
| 6 (最終手段) | CSS / XPath | 他に方法がない場合のみ |

## アサーション

- 自動リトライ付きの Web-first アサーションを使用する（`await expect(locator).toHaveText()` 等）
- 可視性テスト以外での `toBeVisible()` の安易な使用を避ける
- アクセシビリティツリーの検証には `toMatchAriaSnapshot` を使用する

## 待機戦略

- Playwright の組み込み自動待機メカニズムに依存する
- **`page.waitForTimeout()` や固定時間の待機は使用しない**
- タイムアウトのデフォルト値を不必要に増加させない

## ファイル構成

```
src/e2e/
├── playwright.config.ts
├── global-setup.ts          # Testcontainers 起動・スキーマ・シード・スナップショット
├── global-teardown.ts       # コンテナ停止
├── fixtures/
│   ├── seed.sql             # ベースシードデータ（全シナリオ共通）
│   └── <scenario>.sql       # シナリオ固有シードデータ
├── pages/
│   └── <page-name>.page.ts  # Page Object Model
├── tests/
│   └── <feature>.spec.ts    # テストファイル
└── tsconfig.json
```

## Page Object Model (POM)

- ロケーターとページ操作をページオブジェクトクラスにカプセル化する
- テストコードにはロケーターを直接書かず、ページオブジェクト経由でアクセスする
- UI 変更時の修正箇所をページオブジェクト1箇所に限定する

## テスト実行

- 全テスト実行: `npm test` (`playwright test`)
- UI モード: `npm run test:ui` (`playwright test --ui-host=0.0.0.0`)
- レポート確認: `npm run test:report` (`playwright show-report --host 0.0.0.0`)
- 単一テスト: `npx playwright test tests/specific.spec.ts`
- デバッグ: `npx playwright test --debug`

## 参考リソース

- [Testcontainers Node.js PostgreSQL モジュール](https://node.testcontainers.org/modules/postgresql/)
- [Playwright ドキュメント](https://playwright.dev/docs/intro)
- [Playwright ロケーターガイド](https://playwright.dev/docs/locators)
