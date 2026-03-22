---
description: 'Unit テスト（xUnit / Vitest）のコードレビュー観点'
applyTo: 'src/backend.tests/**,src/frontend/src/test/**'
excludeAgent: 'coding-agent'
---

# Unit テスト コードレビューガイドライン

本プロジェクトのユニットテスト（Backend: xUnit + C# / Frontend: Vitest + React Testing Library）をレビューする際の観点。

## レビュー観点一覧

| カテゴリ | 重要度 | 概要 |
|---------|-------|------|
| テスト設計 | 高 | 独立性、命名、境界値、網羅性 |
| アサーション | 高 | 適切な検証、エラーメッセージの明瞭性 |
| テストデータ | 中 | 再現性、独立性、境界値 |
| モック・スタブ | 中 | 適切な分離、過剰モックの回避 |
| 構造・保守性 | 中 | 可読性、DRY、セットアップの整理 |
| フレームワーク固有 | 低 | xUnit / Vitest の機能の適切な使用 |

## テスト設計

### テストの独立性

- 各テストが他のテストの結果に依存していないか
- テスト間で共有状態（static 変数、グローバル変数等）を変更していないか
- テスト実行順序に関係なく成功するか

### テストの命名

テスト名からテスト対象・条件・期待結果が読み取れるか。

```csharp
// ✅ GOOD: 意図が明確
[Fact]
public void TemperatureF_WhenCelsiusIsZero_Returns32()

// ❌ BAD: 何をテストしているか不明
[Fact]
public void Test1()
```

```typescript
// ✅ GOOD: 意図が明確
it('renders error message when API returns 500')

// ❌ BAD: 何をテストしているか不明
it('works correctly')
```

### テストの網羅性

- 正常系だけでなく異常系（エラー、例外、バリデーションエラー）もテストしているか
- 境界値が考慮されているか（最小値、最大値、ゼロ、空、null）
- 同値分割法で入力のクラスを網羅しているか

### テストの単一責務

- 1 テストケースで 1 つの振る舞いのみを検証しているか
- テストが複数の無関係なアサーションを含んでいないか
- テストが失敗したとき、原因が特定しやすいか

## アサーション

### 適切なアサーション選択

アサーションは意図を明確に表すものを選択しているか。

```csharp
// ✅ GOOD: 具体的なアサーション
Assert.Equal(expected, actual);
Assert.Contains("error", message);
Assert.Throws<ArgumentNullException>(() => sut.Process(null));

// ❌ BAD: 曖昧なアサーション
Assert.True(actual == expected);    // 失敗メッセージが不明瞭
Assert.NotNull(result);             // 値の検証が不十分
```

```typescript
// ✅ GOOD: 具体的なアサーション
expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
expect(items).toHaveLength(3);

// ❌ BAD: 曖昧なアサーション
expect(result).toBeTruthy();        // 何が true であるべきか不明
```

### アサーションの数

- 1 テストケースのアサーション数が適切か（目安: 1〜3 個）
- 複数アサーションが必要な場合、関連性があるか
- アサーション過多ならテスト分割を検討すべきか

## テストデータ

### パラメータ化テスト

- 同じロジックを複数の入力値でテストする場合、パラメータ化されているか
- テストデータが網羅的か（正常値、境界値、異常値）

```csharp
// ✅ GOOD: Theory + InlineData でパラメータ化
[Theory]
[InlineData(0, 32)]     // 境界値: ゼロ
[InlineData(100, 212)]  // 正常値
[InlineData(-40, -40)]  // 負の値
public void TemperatureF_KnownValues(int celsius, int expectedFahrenheit)
{
    var forecast = new WeatherForecast(DateOnly.FromDateTime(DateTime.Now), celsius, null);
    Assert.Equal(expectedFahrenheit, forecast.TemperatureF);
}
```

```typescript
// ✅ GOOD: test.each でパラメータ化
it.each([
  { input: 0, expected: 32 },
  { input: 100, expected: 212 },
  { input: -40, expected: -40 },
])('converts $input°C to $expected°F', ({ input, expected }) => {
  expect(celsiusToFahrenheit(input)).toBe(expected);
});
```

### テストデータの再現性

- テストデータが固定値か（ランダム値はデバッグを困難にする）
- 日付・タイムスタンプ依存のテストが時刻に左右されないか
- テストデータの意図がコメントや変数名で明確か

## モック・スタブ

### 適切な分離

- 外部依存（DB、API、ファイルシステム）が適切にモックされているか
- テスト対象のロジックのみを検証しているか（モック対象はテスト対象ではない）

### 過剰モックの回避

- モックが多すぎて実際の動作と乖離していないか
- 内部実装の詳細をモックしすぎていないか（リファクタリング耐性の低下）
- Integration テストで検証すべき内容を Unit テストで無理にモックしていないか

```typescript
// ✅ GOOD: API レスポンスのモック（外部依存の分離）
globalThis.fetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify(mockData), { status: 200 })
);

// ❌ BAD: 内部実装のモック（リファクタリングで壊れる）
vi.spyOn(component, 'internalMethod').mockReturnValue('value');
```

### Backend: WebApplicationFactory

- Integration テストで `WebApplicationFactory` を適切に使用しているか
- テスト用の DI 設定（In-Memory DB 等）が `WebApplicationFactory` のカスタマイズで行われているか

## 構造・保守性

### セットアップの整理

- 共通のセットアップが `beforeEach` / コンストラクタ で適切に配置されているか
- テスト固有のセットアップがテストメソッド内に配置されているか
- セットアップコードが冗長でないか

### 可読性

- テストコードが上から下に読める構造か
- ヘルパーメソッドで共通の生成ロジックが整理されているか
- テストコードからテスト対象の振る舞いがすぐに理解できるか

### DRY vs 可読性のバランス

- テスト間で過度に共通化していないか（テストの独立性・可読性を損なう）
- ヘルパーメソッドの抽象化レベルが適切か
- 各テストを読んだだけで意図が完結して理解できるか

## フレームワーク固有

### xUnit（Backend）

- `[Fact]` と `[Theory]` の使い分けが適切か
- `IClassFixture` / `ICollectionFixture` で高コストなリソースを共有しているか
- "Arrange" / "Act" / "Assert" コメントは不要（プロジェクト規約）
- テストクラス名が `<対象クラス>Tests` パターンか
- `Assert.Throws<T>` で例外の型を検証しているか

### Vitest + React Testing Library（Frontend）

- `render` / `screen` / `userEvent` を適切に使用しているか
- `@testing-library/jest-dom` のマッチャー（`toBeInTheDocument` 等）を活用しているか
- コンポーネントの内部実装ではなくユーザー視点（テキスト、ロール）でクエリしているか
- `userEvent` で実際のユーザー操作をシミュレートしているか（`fireEvent` より推奨）
- `act()` 警告が出ていないか

```typescript
// ✅ GOOD: ユーザー視点のクエリ
expect(screen.getByRole('button', { name: '送信' })).toBeEnabled();

// ❌ BAD: 実装依存のクエリ
expect(document.querySelector('.submit-btn')).not.toBeDisabled();
```

## レビューチェックリスト

- [ ] テストが独立して実行可能か
- [ ] テスト名がテスト対象・条件・期待結果を表しているか
- [ ] 正常系・異常系・境界値がカバーされているか
- [ ] 1 テスト 1 責務になっているか
- [ ] アサーションが具体的で意図が明確か
- [ ] パラメータ化テストが活用されているか
- [ ] モックが適切な範囲に限定されているか
- [ ] テストデータが固定値で再現可能か
- [ ] フレームワーク固有の機能を適切に使用しているか
- [ ] テストコードの可読性が十分か
