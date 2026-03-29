---
name: maestro-generate-test
description: >-
  Maestro モバイル E2E テストをシナリオ設計からフロー生成・実行まで一貫して行うスキル。
  GraalJS セレクタ (POM Layer 1) + YAML サブフロー (POM Layer 2) で保守性を高め、
  onFlowStart フックで API 経由のシードデータ投入を行い Flaky を排除する。
  src/maestro/flows/ にテストフローを作成し、通るまで修正する。
  docs/specs/{feature}/plan/ の Acceptance Criteria がある場合はそれをシナリオの基盤とする。
  パイプライン: dev-plan → mobile-implement → mobile-unit-test → [maestro-generate-test]
  ⚠ このスキルは「[maestro-generate-test] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: maestro-generate-test, maestro, mobile, e2e, android, ios, flow, yaml, docs/specs.
---

# Maestro テスト生成スキル

対象機能のモバイルアプリ実装を調査し、テストシナリオの設計から YAML フロー生成・実行まで
一貫して行う。**GraalJS セレクタ (POM Layer 1)** で UI 要素を集中管理し、
**YAML サブフロー (POM Layer 2)** で操作をカプセル化して、テストの保守性を高める。

## パイプラインにおける位置づけ

```
dev-plan → mobile-implement → mobile-unit-test → [maestro-generate-test]
                                                          ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **mobile-implement**: 計画をもとに Android / iOS / バックエンドを実装済み
3. **mobile-unit-test**: 実装に対して単体テストを構築済み
4. **このスキル (maestro-generate-test)**: 計画の Acceptance Criteria をもとにモバイル E2E テストを構築する

### Acceptance Criteria の参照

`docs/specs/{feature}/plan/` が存在する場合、各タスクファイル (`task-NN-*.md`) の
**Acceptance Criteria** セクションをテストシナリオの基盤とする。

- `AC-NN-XX` 形式の各項目を1つのテストフロー (`.yaml`) に対応させる
- AC がないテストは機能調査に基づいて独自にシナリオを設計する

`{feature}` はユーザーが指定する機能ディレクトリ名（例: `saas-portal-mobile-app`）。

## 呼び出し規約

> **このスキルは `[maestro-generate-test] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[maestro-generate-test] saas-portal-mobile-app` | ✅ 実行する |
| `モバイルのE2Eテストを作って` | ❌ 実行しない — プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[maestro-generate-test] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/` が存在する場合は AC をシナリオの基盤とする。存在しない場合は機能調査で代替する
3. `src/mobile/android/` または `src/mobile/ios/` に実装がない場合は、先に `[mobile-implement] {feature}` を案内する

## このスキルを使うタイミング

- 新しい画面・機能の **モバイル E2E テスト** を作成するとき
- 既存テストに **テストフローを追加** するとき
- **リグレッションテスト** を強化するとき
- **テストシナリオ設計** からフロー生成・実行までを一括で行いたいとき

## 前提条件

- テストフローは `src/maestro/flows/<feature>/` に配置する
- ファイル命名規則: `<scenario>.yaml` (kebab-case)
- Maestro CLI がインストール済みであること
- Android エミュレータまたは iOS シミュレータが起動中であること
- Backend (FastAPI) が起動済みであること

### Maestro のインストール

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

> **前提**: Java 17+ がインストール済みであること

## ディレクトリ構成

```
src/maestro/
├── config.yaml                     # ワークスペース設定
├── elements/                       # セレクタ定義 (POM Layer 1)
│   ├── login.js
│   ├── dashboard.js
│   ├── services.js
│   └── settings.js
├── subflows/                       # 再利用可能アクション (POM Layer 2)
│   ├── load-elements.yaml          # 全セレクタ一括ロード
│   ├── login.yaml
│   ├── navigate.yaml
│   └── setup-test-data.yaml
├── scripts/                        # GraalJS ユーティリティ
│   ├── seed-data.js                # シードデータ投入
│   └── cleanup-data.js             # データクリーンアップ
└── flows/                          # テストフロー
    ├── auth/
    ├── dashboard/
    └── services/
```

## Page Object Model (POM) — 2 層アーキテクチャ

### 設計思想

Playwright の **クラスベース POM** に対応する Maestro 独自の POM パターン。
セレクタの変更が1箇所で済み、操作の再利用性を保証する。

| 層 | ファイル | 責務 |
|----|---------|------|
| **Layer 1: セレクタ** | `elements/<screen>.js` | UI 要素の `id` を名前空間付きで集中管理 |
| **Layer 2: アクション** | `subflows/<action>.yaml` | パラメータ付き再利用可能な操作手順 |
| **テストフロー** | `flows/<feature>/<scenario>.yaml` | Layer 1 + 2 を組み合わせたテストケース |

### Layer 1: セレクタ定義 (`elements/*.js`)

```javascript
// elements/login.js
output.login = {
  emailInput: 'login_email_field',
  passwordInput: 'login_password_field',
  loginButton: 'login_button',
  errorMessage: 'login_error_text'
}
```

**規約:**
- `output.<screen>.<element>` で名前空間を分離する — スクリプト間の衝突を防ぐ
- 値は `id:` セレクタで使用する識別子 (testTag / accessibilityIdentifier)
- 画面内のセクションはネスト: `output.dashboard.summary.totalServices`
- 命名: `snake_case` で `<screen>_<component>_<element>` 形式

### Layer 2: サブフロー (`subflows/*.yaml`)

```yaml
# subflows/login.yaml
appId: ${APP_ID}
---
- runScript: ../elements/login.js
- tapOn:
    id: ${output.login.emailInput}
- inputText: ${EMAIL}
- tapOn:
    id: ${output.login.passwordInput}
- inputText: ${PASSWORD}
- tapOn:
    id: ${output.login.loginButton}
```

**規約:**
- サブフローの先頭で `runScript` により必要なセレクタを自己ロードする
- パラメータ (`EMAIL`, `PASSWORD` 等) は呼び出し元の `env` から注入する
- **アサーション (`assertVisible` 等) はフロー側に書く** — サブフローには書かない
- 1 サブフロー = 1 操作単位 (ログイン、ナビゲーション等)

### セレクタ一括ロード

```yaml
# subflows/load-elements.yaml
appId: ${APP_ID}
---
- runScript: ../elements/login.js
- runScript: ../elements/dashboard.js
- runScript: ../elements/services.js
- runScript: ../elements/settings.js
```

## セレクタ戦略

### 優先順位

| 優先度 | セレクタ | 安定性 | 用途 |
|--------|---------|--------|------|
| 1 (推奨) | `id:` | ◎ テキスト変更・ローカライズに影響されない | すべての操作対象要素 |
| 2 | `text:` | △ ローカライズで壊れる | 静的テキストの検証 |
| 3 (最終手段) | `index:` | ✕ 構造変更で壊れる | 他に手段がない場合のみ |

### アプリ側の必須対応

テスト対象の UI 要素には `testTag` (Android) / `accessibilityIdentifier` (iOS) を必ず付与する。

```kotlin
// Android: Jetpack Compose
Button(
    onClick = { onLogin() },
    modifier = Modifier.testTag("login_button")
) { Text("ログイン") }
```

```swift
// iOS: SwiftUI
Button("ログイン") { onLogin() }
    .accessibilityIdentifier("login_button")
```

**命名規約:** `<screen>_<component>_<element>` (snake_case)
例: `login_email_field`, `dashboard_summary_total_services`, `services_list_item`

## テストデータ管理

Maestro からはアプリ外部の DB に直接アクセスできないため、**テスト用 API エンドポイント**
を経由して `onFlowStart` / `onFlowComplete` フックでデータを管理する。

詳細な実装パターン（FastAPI テスト用エンドポイント、GraalJS シードスクリプト）は
[test-data-management.md](./references/test-data-management.md) を参照。

### データ管理フロー

```
onFlowStart (各フロー実行前)
├─ /api/test/reset → 全コレクションクリア
└─ /api/test/seed → テストデータ投入

テストフロー実行

onFlowComplete (各フロー実行後)
└─ /api/test/reset → クリーンアップ
```

### プラットフォーム別ホスト

| プラットフォーム | API ホスト |
|----------------|-----------|
| Android エミュレータ | `http://10.0.2.2:8000` |
| iOS シミュレータ | `http://localhost:8000` |

## Testcontainers 統合 (CI パイプライン)

Maestro と Testcontainers は異なるレイヤーで動作するため、**CI パイプラインレベル**で統合する。
CI 起動スクリプト、Testcontainers Python ヘルパー、GitHub Actions ワークフロー例は
[ci-pipeline.md](./references/ci-pipeline.md) を参照。

```
CI/CD パイプライン
├─ Testcontainers で MongoDB 起動 → FastAPI を MONGO_URI 付きで起動
├─ エミュレータ / シミュレータ起動
├─ Maestro テスト実行 (onFlowStart でシードデータ投入)
└─ Testcontainers が MongoDB を自動破棄
```

## Flaky テスト対策

Maestro は以下のメカニズムで自動的に Flaky を軽減する:

| メカニズム | 詳細 | 設定可否 |
|-----------|------|---------|
| 要素検索タイムアウト | 17 秒間自動ポーリング | ❌ ハードコード |
| タップ自動リトライ | 最大 2 回 | ❌ ハードコード |
| 画面遷移検出 | アニメーション完了を自動検出 | ❌ 自動 |
| `retry` ブロック | 明示的リトライ (最大 3 回) | ⚠️ 上限 3 固定 |
| `extendedWaitUntil` | カスタムタイムアウト指定 | ✅ 設定可能 |

### 追加で実施すべき対策

- `id:` セレクタ優先 — テキスト変更・ローカライズの影響を排除
- `onFlowStart` でデータリセット — フロー間のデータ依存を排除
- CI でアニメーション無効化 — `adb shell settings put global animator_duration_scale 0`

## ワークフロー

このスキルが実行するワークフロー:

### Step 1: 調査

1. `docs/specs/{feature}/plan/` の Acceptance Criteria を確認する
2. `src/mobile/android/` および `src/mobile/ios/` の実装を確認する
3. テスト対象画面の testTag / accessibilityIdentifier を確認する
4. 既存の `src/maestro/` 構造を確認する

### Step 2: POM セレクタ設計

1. テスト対象画面のセレクタ定義 (`elements/<screen>.js`) を作成/更新する
2. 必要なサブフロー (`subflows/<action>.yaml`) を作成/更新する
3. `subflows/load-elements.yaml` を更新する

### Step 3: テストフロー生成

1. AC 項目ごとにテストフロー (`flows/<feature>/<scenario>.yaml`) を作成する
2. `onFlowStart` でシードデータ投入、`onFlowComplete` でクリーンアップを設定する
3. 適切なタグ (`smoke`, `regression`, `<feature>`) を付与する

### Step 4: 実行・修正

1. `maestro test flows/<feature>/` でテストを実行する
2. 失敗したフローを修正する
3. 全フローが通るまで繰り返す

### Step 5: テスタビリティ確認

1. アプリ側に不足している testTag / accessibilityIdentifier がないか確認する
2. 不足がある場合は `[kotlin-compose-screen]` / `[swift-swiftui-view]` で追加を案内する

## テストフロー完全例

```yaml
# flows/dashboard/view-summary.yaml
appId: com.example.saasportal
tags:
  - smoke
  - dashboard
onFlowStart:
  - runScript: ../../scripts/seed-data.js
onFlowComplete:
  - runScript: ../../scripts/cleanup-data.js
---
# Step 1: セレクタをロード
- runFlow:
    file: ../../subflows/load-elements.yaml

# Step 2: アプリを起動してログイン
- launchApp
- runFlow:
    file: ../../subflows/login.yaml
    env:
      EMAIL: "user@example.com"
      PASSWORD: "password123"

# Step 3: ダッシュボードの表示を検証
- assertVisible:
    id: ${output.dashboard.heading}
- assertVisible:
    id: ${output.dashboard.summary.totalServices}
- assertVisible:
    id: ${output.dashboard.summary.totalUsage}

# Step 4: トレンドチャートの表示を検証 (Flaky 対策付き)
- retry:
    times: 3
    commands:
      - assertVisible:
          id: ${output.dashboard.trendChart}
```

## config.yaml テンプレート

```yaml
# src/maestro/config.yaml
flows:
  - "flows/**/*.yaml"

executionOrder:
  continueOnFailure: false

excludeTags:
  - wip
  - skip
```

## トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 要素が見つからない (17 秒タイムアウト) | testTag / accessibilityIdentifier 未設定 | アプリ側に `Modifier.testTag()` / `.accessibilityIdentifier()` を追加 |
| `http.post` が接続拒否 | ホスト指定が間違い | Android: `10.0.2.2`, iOS: `localhost` を使用 |
| `output.*` が `undefined` | `runScript` 未実行 or 名前空間の不一致 | サブフロー先頭で `runScript` を実行、`output.<screen>.*` の名前空間を確認 |
| `retry` が 3 回以上効かない | Maestro のハードコード上限 | `retry.times` は最大 3。超える場合は `extendedWaitUntil` を使用 |
| シードデータが残留する | `onFlowComplete` 未設定 | フローに `onFlowComplete` で `/api/test/reset` を呼ぶスクリプトを設定 |
| CI でテストが不安定 | エミュレータのアニメーション | `adb shell settings put global animator_duration_scale 0` を実行 |
| `maestro studio` が起動しない | Java 17 未インストール | `java -version` で確認、17+ をインストール |

## 参照

- [テストデータ管理](./references/test-data-management.md) — テスト API エンドポイント設計、GraalJS シードスクリプト
- [CI パイプライン統合](./references/ci-pipeline.md) — Testcontainers、GitHub Actions ワークフロー

## 検証

- 全フロー実行: `cd src/maestro && maestro test .`
- 特定フロー実行: `cd src/maestro && maestro test flows/<feature>/<scenario>.yaml`
- 特定機能: `cd src/maestro && maestro test flows/<feature>/`
- タグ指定: `cd src/maestro && maestro test . --include-tags=smoke`
- 要素確認: `maestro studio`
- バージョン確認: `maestro --version`
