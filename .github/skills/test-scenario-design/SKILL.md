---
name: test-scenario-design
description: >-
  ISTQB のテスト設計技法に基づいてテストシナリオを体系的に設計・生成するスキル。
  E2E テスト（Playwright）はユーザー利用シナリオベース、
  Unit テスト（xUnit / Vitest）はホワイトボックス・ブラックボックス技法で設計する。
  テスト対象の実装を調査し、シナリオ設計 → コード生成 → 実行検証まで一貫して行う。
  Use when asked to design test scenarios, create test plans, generate test cases
  based on ISTQB principles, or systematically improve test coverage for E2E or unit tests.
---

# テストシナリオ設計スキル（ISTQB ベース）

ISTQB（International Software Testing Qualifications Board）のテスト設計技法に基づき、
E2E テストとユニットテストのシナリオを体系的に設計・生成する。

## スコープ

| テストレベル | フレームワーク | 対象ディレクトリ | 設計アプローチ |
|---|---|---|---|
| E2E テスト | Playwright + TypeScript | `src/e2e/tests/` | ユーザー利用シナリオベース（受入テスト観点） |
| Unit テスト（Backend） | xUnit + C# | `src/backend.tests/` | ホワイトボックス + ブラックボックス |
| Unit テスト（Frontend） | Vitest + React Testing Library | `src/frontend/src/test/` | ブラックボックス（コンポーネント単位） |

## テストシナリオドキュメントの格納先

設計したテストシナリオ（Markdown ドキュメント）は以下のディレクトリに格納する:

```
docs/spec/{作業名}/test/
```

- `{作業名}` はテスト対象の機能や作業の名称に置き換える（例: `user-registration`, `weather-forecast`）
- ディレクトリが存在しない場合は作成する
- ファイル命名規則: `<テストレベル>-<機能名>.md`（例: `e2e-weather-forecast.md`, `unit-temperature-conversion.md`）
- テストシナリオのレビュー・承認後もドキュメントとして保持し、テストコードとの対応を維持する

## ワークフロー

### Step 1: 対象機能の調査

テスト対象の実装を調査し、テスト設計に必要な情報を収集する。

#### 1-1. コード調査

- **フロントエンド** (`src/frontend/src/`): コンポーネント構造、Props、状態管理、イベントハンドラ、API 通信
- **バックエンド** (`src/backend/`): API エンドポイント、ビジネスロジック、データモデル、バリデーション、DB 操作
- **既存テスト**: 既存テストのカバレッジと設計パターンを確認し、不足を特定

#### 1-2. 仕様・要件の確認

- ユーザーからテスト対象の機能仕様・業務要件をヒアリングする
- 明確な仕様がない場合はコードから振る舞いを推測し、ユーザーに確認する

### Step 2: テスト分析（ISTQB テスト分析）

調査結果を元に、テスト条件（何をテストするか）を洗い出す。

#### 2-1. テストベースの特定

| テストベース | 例 |
|---|---|
| 機能仕様 | API 仕様、画面仕様、ユーザーストーリー |
| 実装コード | コンポーネント、エンドポイント、ビジネスロジック |
| 非機能要件 | パフォーマンス、アクセシビリティ、セキュリティ |
| リスク分析 | ビジネスインパクト × 障害確率で優先度付け |

#### 2-2. テスト条件の抽出

対象機能から以下の観点でテスト条件を網羅的に洗い出す:

- 入力データ（正常値、異常値、境界値、空値）
- 状態遷移（初期状態、操作後の状態変化）
- 出力・表示（成功表示、エラー表示、ローディング状態）
- 外部依存（API レスポンス、DB データ、認証状態）

### Step 3: テスト設計（技法の適用）

テストレベルに応じた設計技法を適用してテストケースを導出する。

---

#### E2E テスト設計（ユーザー利用シナリオベース）

E2E テストはシステムテスト・受入テストレベルで設計する。
ユーザーの操作フローに沿ったシナリオベースで、エンドツーエンドの動作を検証する。

**適用する技法:**

| 技法 | 目的 | 適用例 |
|---|---|---|
| ユースケーステスト | 主要ユーザーフローの検証 | ページ表示 → データ入力 → 送信 → 結果確認 |
| 状態遷移テスト | UI 状態遷移の検証 | ローディング → 成功/エラー、モーダル開閉 |
| デシジョンテーブル | 条件組合せの検証 | フォーム入力の有効/無効パターン |
| 探索的テスト観点 | エッジケースの発見 | 連続操作、想定外の操作順序 |

**シナリオ設計フォーマット:**

```markdown
## <Feature Name> E2E テストシナリオ

### 前提条件
- アプリケーションが起動していること
- テストデータが初期化されていること

### シナリオ一覧

| # | シナリオ名 | テスト技法 | 前提条件 | ユーザー操作 | 期待結果 | 優先度 | リスク |
|---|----------|----------|---------|------------|---------|-------|------|
| 1 | 正常フロー: データ一覧表示 | ユースケース | 初期状態 | ページにアクセス | データがテーブルに表示される | 高 | 高 |
| 2 | 正常フロー: データ登録 | ユースケース | 一覧画面 | フォームに入力し送信 | 成功メッセージが表示される | 高 | 高 |
| 3 | 異常系: API エラー | 状態遷移 | 初期状態 | ページにアクセス（API障害時） | エラーメッセージが表示される | 中 | 中 |
| 4 | 境界値: 空データ | 境界値分析 | データ0件 | ページにアクセス | 空状態メッセージが表示される | 中 | 低 |
```

**E2E テストのコード規約:**

- `src/e2e/tests/<feature>.spec.ts` に配置
- `test.describe()` でシナリオグループ化
- `test.step()` でユーザー操作をステップ分割
- ロケーターはアクセシビリティ優先 (`getByRole` > `getByLabel` > `getByText`)
- Page Object Model パターンでロケーターをカプセル化
- 固定時間待機（`waitForTimeout`）は使用しない
- Web-first アサーション（自動リトライ付き）を使用

---

#### Unit テスト設計（ブラックボックス技法）

外部仕様に基づき、入出力の関係からテストケースを導出する。
実装の内部構造に依存せず、仕様準拠を検証する。

**適用する技法:**

| 技法 | 目的 | テストケース導出方法 |
|---|---|---|
| 同値分割法 | 代表値で効率的にテスト | 入力を有効/無効クラスに分割し、各クラスから代表値を選択 |
| 境界値分析 | 境界付近のバグ検出 | 同値クラスの境界値（最小、最小-1、最大、最大+1）をテスト |
| デシジョンテーブル | 複数条件の組合せ検証 | 条件と動作の組合せ表を作成し、全ルールをテスト |
| 状態遷移テスト | 状態変化の検証 | 状態遷移図/表を作成し、有効/無効遷移をテスト |

**ブラックボックステストケース設計フォーマット:**

```markdown
## <対象メソッド/コンポーネント> テストケース（ブラックボックス）

### 技法: 同値分割法 + 境界値分析

| # | 同値クラス | 入力値 | 期待出力 | 区分 |
|---|----------|-------|---------|------|
| 1 | 有効: 正の整数 | 25 | 77 (°F) | 正常系 |
| 2 | 有効: ゼロ | 0 | 32 (°F) | 境界値 |
| 3 | 有効: 負の整数 | -40 | -40 (°F) | 正常系 |
| 4 | 無効: null 入力 | null | ArgumentNullException | 異常系 |
```

---

#### Unit テスト設計（ホワイトボックス技法）

実装コードの内部構造を分析し、制御フローを網羅するテストケースを導出する。

**適用する技法:**

| 技法 | カバレッジ基準 | 確認内容 |
|---|---|---|
| ステートメントカバレッジ | 全命令文を最低1回実行 | 未到達コードの検出 |
| ブランチカバレッジ | 全分岐の true/false を実行 | 条件分岐の網羅 |
| 条件カバレッジ | 複合条件の各条件を true/false | 複合条件の各原子条件を検証 |

**ホワイトボックステストケース設計フォーマット:**

```markdown
## <対象メソッド> テストケース（ホワイトボックス）

### 制御フロー分析

対象コード:
\`\`\`csharp
public Result Process(Input input)
{
    if (input is null)           // Branch 1
        return Result.Error();
    if (input.Value > 100)       // Branch 2
        return Result.HighValue();
    return Result.Normal();
}
\`\`\`

### ブランチカバレッジ テストケース

| # | テストケース | Branch 1 | Branch 2 | 期待結果 | カバレッジ目的 |
|---|------------|----------|----------|---------|-------------|
| 1 | null 入力 | true | - | Error | B1-true |
| 2 | Value = 150 | false | true | HighValue | B1-false, B2-true |
| 3 | Value = 50 | false | false | Normal | B1-false, B2-false |
```

### Step 4: テストシナリオのレビュー

設計したシナリオを `docs/spec/{作業名}/test/` に Markdown ファイルとして保存し、ユーザーに提示する。
以下の観点でフィードバックを求める:

- **網羅性**: テスト条件の漏れがないか
- **優先度**: ビジネスリスクに基づいた優先度が適切か
- **実現性**: テスト環境・データの準備が可能か
- **追加/削除**: 不要なテストケースや追加すべきケースがないか

フィードバックを反映してシナリオドキュメントを更新し、確定する。

### Step 5: テストコードの生成

確定したシナリオに基づいてテストコードを生成する。

#### E2E テスト（Playwright）

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('正常フロー: データ一覧表示', async ({ page }) => {
    await test.step('ページにアクセスする', async () => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    await test.step('データがテーブルに表示される', async () => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
      await expect(table.locator('tbody tr')).toHaveCount(5);
    });
  });
});
```

#### Backend Unit テスト（xUnit）

```csharp
namespace backend.tests;

public class FeatureTests
{
    [Fact]
    public void Method_ValidInput_ReturnsExpectedResult()
    {
        var sut = CreateSystemUnderTest();

        var result = sut.Process(new Input(50));

        Assert.Equal(Result.Normal(), result);
    }

    [Theory]
    [InlineData(0, 32)]    // 境界値: ゼロ
    [InlineData(100, 212)] // 境界値: 上限
    [InlineData(-40, -40)] // 境界値: 下限
    public void Method_BoundaryValues_ReturnsExpected(int input, int expected)
    {
        var sut = CreateSystemUnderTest();

        var result = sut.Calculate(input);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Method_NullInput_ThrowsArgumentNullException()
    {
        var sut = CreateSystemUnderTest();

        Assert.Throws<ArgumentNullException>(() => sut.Process(null));
    }
}
```

#### Frontend Unit テスト（Vitest + React Testing Library）

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FeatureComponent } from '../FeatureComponent';

describe('FeatureComponent', () => {
  // ブラックボックス: 正常系 - 同値分割
  it('renders data when valid props are provided', () => {
    render(<FeatureComponent data={validData} />);
    expect(screen.getByText('Expected Output')).toBeInTheDocument();
  });

  // ブラックボックス: 境界値 - 空データ
  it('renders empty state when data is empty', () => {
    render(<FeatureComponent data={[]} />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  // ブラックボックス: 異常系 - エラー状態
  it('renders error message when error prop is set', () => {
    render(<FeatureComponent data={[]} error="Network error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
  });
});
```

### Step 6: テストの実行と検証

生成したテストを実行し、結果を検証する。

```bash
# E2E テスト
cd src/e2e && npx playwright test tests/<feature>.spec.ts

# Backend Unit テスト
cd src/backend.tests && dotnet test --filter "ClassName=<TestClass>"

# Frontend Unit テスト
cd src/frontend && npx vitest run src/test/<feature>.test.tsx
```

- 失敗したテストのエラー内容を分析し、テストコードまたはシナリオを修正する
- テストが安定して通るまで反復する

### Step 7: テストカバレッジの確認と報告

最終的なテスト成果をまとめてユーザーに報告する。

**報告フォーマット:**

```markdown
## テスト設計レポート

### 対象機能
<機能名と概要>

### テスト設計サマリ

| テストレベル | テストケース数 | 適用技法 | カバレッジ |
|---|---|---|---|
| E2E | N 件 | ユースケース, 状態遷移 | 主要フロー網羅 |
| Unit（ブラックボックス） | N 件 | 同値分割, 境界値分析 | 入出力パターン網羅 |
| Unit（ホワイトボックス） | N 件 | ブランチカバレッジ | 全分岐網羅 |

### リスクと残課題
- 未カバーのリスク領域
- 追加テストの推奨事項
```

## ISTQB テスト設計技法リファレンス

### ブラックボックス技法

| 技法 | いつ使うか | テストケースの導出手順 |
|---|---|---|
| **同値分割法** | 入力値に明確な範囲・カテゴリがある場合 | 1. 入力を有効/無効の同値クラスに分類 → 2. 各クラスから代表値を1つ選択 |
| **境界値分析** | 数値範囲や文字列長に制限がある場合 | 1. 同値クラスの境界を特定 → 2. 境界値・境界値±1 でテスト |
| **デシジョンテーブル** | 複数の条件が結果に影響する場合 | 1. 条件とアクションを列挙 → 2. 全組合せの表を作成 → 3. 各ルールをテスト |
| **状態遷移テスト** | 画面遷移やオブジェクトの状態管理がある場合 | 1. 状態遷移図を作成 → 2. 有効遷移と無効遷移のテストケースを導出 |
| **ユースケーステスト** | ユーザーの操作フローを検証する場合 | 1. 主成功シナリオを定義 → 2. 代替・例外シナリオを追加 → 3. 各シナリオをテスト |

### ホワイトボックス技法

| 技法 | いつ使うか | テストケースの導出手順 |
|---|---|---|
| **ステートメントカバレッジ** | 全コード行を最低1回実行したい場合 | 1. 制御フローグラフを作成 → 2. 全ノードを通るパスを特定 → 3. パスごとにテストケース作成 |
| **ブランチカバレッジ** | 全分岐を網羅したい場合 | 1. 分岐を特定 → 2. 各分岐の true/false を通るテストケースを作成 |
| **条件カバレッジ** | 複合条件の各部分を個別に検証したい場合 | 1. 複合条件の原子条件を分解 → 2. 各原子条件の true/false をテスト |

## 注意事項

- テストシナリオ設計は必ずユーザーのレビュー・承認を経てからコード生成に進む
- ホワイトボックステストは対象コードを先に読み、制御フローを理解してから設計する
- 既存テストとの重複を避け、差分カバレッジを意識する
- テストデータは再現可能で独立性のある値を使用する
- テスト名はシナリオの意図が分かる命名にする
