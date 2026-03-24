---
description: 'Playwright E2E テストのコードレビュー観点'
applyTo: 'src/e2e/**'
excludeAgent: 'coding-agent'
---

# Playwright E2E テスト コードレビューガイドライン

本プロジェクト（Playwright + TypeScript + Testcontainers）の E2E テストコードをレビューする際の観点。

## レビュー観点一覧

| カテゴリ | 重要度 | 概要 |
|---------|-------|------|
| テスト安定性 | 高 | Flaky テストの防止、待機戦略 |
| ロケーター品質 | 高 | アクセシビリティ優先、特定性 |
| テスト設計 | 高 | 独立性、シナリオの妥当性 |
| データ管理 | 中 | Testcontainers、シードデータ |
| アサーション | 中 | Web-first アサーション、適切な検証 |
| 構造・保守性 | 中 | POM パターン、命名、ファイル構成 |

## テスト安定性（Flaky テスト防止）

### 固定時間待機の禁止

- `page.waitForTimeout()` を使用していないか
- タイムアウトのデフォルト値を不必要に増加させていないか
- Playwright の組み込み自動待機メカニズムに依存しているか

```typescript
// ✅ GOOD: Web-first アサーション（自動リトライ付き）
await expect(page.getByRole('heading')).toContainText('成功');

// ❌ BAD: 固定時間待機
await page.waitForTimeout(3000);
await expect(page.getByRole('heading')).toContainText('成功');
```

### レースコンディション

- テスト間でグローバルな状態（DB データ等）に依存していないか
- API レスポンスを待たずにアサーションしていないか
- ページ遷移後のアサーションで新しいページの要素を正しく待機しているか

### テスト順序依存

- テストが実行順序に依存していないか
- 各テストが独立して実行可能か
- `beforeEach` で必要な前提状態を設定しているか

## ロケーター品質

### 優先順位の遵守

ロケーターは以下の優先順位で選択されているか確認する:

| 優先度 | ロケーター | 用途 |
|---|---|---|
| 1 (最優先) | `getByRole` | ボタン、リンク、見出し等 |
| 2 | `getByLabel` | フォーム入力要素 |
| 3 | `getByText` | テキストコンテンツ |
| 4 | `getByPlaceholder` | プレースホルダー付き入力 |
| 5 | `data-testid` | 上記が使えない場合のみ |
| 6 (最終手段) | CSS / XPath | 他に方法がない場合のみ |

```typescript
// ✅ GOOD: アクセシビリティロケーター
await page.getByRole('button', { name: '送信' }).click();
await page.getByLabel('メールアドレス').fill('test@example.com');

// ❌ BAD: CSS セレクター（実装依存、壊れやすい）
await page.click('.btn-primary');
await page.fill('#email-input', 'test@example.com');
```

### 特定性

- ロケーターが一意の要素を指しているか（strict mode 違反がないか）
- 過度に具体的すぎるロケーター（壊れやすい）になっていないか
- `nth()` やインデックスに頼りすぎていないか

## テスト設計

### シナリオの妥当性

- テストがユーザーの実際の操作フローを反映しているか
- 正常系だけでなく異常系（エラー表示、バリデーション）もカバーしているか
- テスト名がシナリオの意図を明確に表しているか
- `test.step()` でユーザー操作がわかりやすくグループ化されているか

```typescript
// ✅ GOOD: 意図が明確なテスト名 + step 分割
test('データ登録 - 有効な入力で送信すると成功メッセージが表示される', async ({ page }) => {
  await test.step('フォームに入力する', async () => {
    await page.getByLabel('名前').fill('テスト太郎');
    await page.getByLabel('メール').fill('test@example.com');
  });

  await test.step('送信する', async () => {
    await page.getByRole('button', { name: '送信' }).click();
  });

  await test.step('成功メッセージを確認する', async () => {
    await expect(page.getByText('登録が完了しました')).toBeVisible();
  });
});

// ❌ BAD: 何をテストしているか不明
test('test1', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('.message')).toBeVisible();
});
```

### テストの独立性

- 各テストが他のテストの結果に依存していないか
- `beforeEach` で初期状態をリセットしているか
- テストデータが他のテストと競合しないか

### カバレッジの妥当性

- 主要なユーザーフローがカバーされているか
- 境界ケース（空データ、大量データ）が考慮されているか
- テストの重複がないか（同じシナリオを異なるテストで検証していないか）

## データ管理（Testcontainers）

### スナップショット管理

- `globalSetup.ts` でベーススナップショットが作成されているか
- `beforeEach` でスナップショットからリストアしているか
- シナリオ固有のシードデータがテスト内で投入されているか

### データの再現性

- テストデータが固定値（再現可能）か
- ランダムデータを使用する場合、デバッグ可能か（シード値の記録等）
- タイムスタンプ依存のテストに注意しているか

## アサーション

### Web-first アサーション

- `await expect(locator)` のリトライ付きアサーションを使用しているか
- `toBeVisible()` を可視性テスト以外で安易に使用していないか
- アサーションが十分に具体的か（`toBeVisible` だけでなく内容も検証）

```typescript
// ✅ GOOD: 内容も検証する具体的なアサーション
await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(5);
await expect(page.getByRole('cell', { name: '東京' })).toBeVisible();

// ❌ BAD: 可視性だけの曖昧なアサーション
await expect(page.locator('table')).toBeVisible();
```

### アサーションの適切な粒度

- 1 テストケースのアサーションが多すぎないか
- アサーション対象が明確か（何を検証しているかわかるか）
- ネガティブアサーション（`not.toBeVisible()` 等）が適切に使われているか

## 構造・保守性

### Page Object Model (POM)

- ロケーターがページオブジェクトにカプセル化されているか
- テストコードに直接ロケーターが散在していないか
- ページオブジェクトのメソッドがユーザー操作を表す動詞で命名されているか
- UI 変更時の修正箇所がページオブジェクト 1 箇所に限定されているか

### ファイル構成

- テストファイルが `tests/` に配置されているか
- ページオブジェクトが `pages/` に配置されているか
- ファイル名が `<feature>.spec.ts` / `<page>.page.ts` パターンか
- 1 ファイルに 1 つの主要機能のテストか

### 命名

- テスト名が `Feature - 具体的なアクションまたはシナリオ` 形式か
- `describe` ブロックが機能単位でグループ化されているか

## レビューチェックリスト

- [ ] `waitForTimeout()` を使用していないか
- [ ] ロケーターがアクセシビリティ優先順位に従っているか
- [ ] CSS セレクター / XPath の使用が最小限か
- [ ] テストが独立して実行可能か
- [ ] テスト名がシナリオの意図を表しているか
- [ ] `test.step()` でユーザー操作がグループ化されているか
- [ ] Web-first アサーション（自動リトライ付き）を使用しているか
- [ ] Page Object Model パターンを使用しているか
- [ ] テストデータの管理が再現可能か
- [ ] Testcontainers のスナップショット管理が適切か
