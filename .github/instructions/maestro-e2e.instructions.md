---
description: 'Maestro を使用したモバイル E2E テストの規約。YAML 宣言的フロー、GraalJS セレクタ (POM)、サブフロー再利用、Flaky 排除'
applyTo: 'src/maestro/**/*.yaml, src/maestro/**/*.js'
---

# Maestro モバイル E2E テスト規約

## 概要

Android (Jetpack Compose) と iOS (SwiftUI) の E2E テストを **Maestro** で実行する。
テストは YAML 宣言的フローで記述し、セレクタは GraalJS で集中管理する (POM パターン)。

## ファイル配置

| 種類 | パス | 命名規則 |
|------|------|---------|
| ワークスペース設定 | `src/maestro/config.yaml` | — |
| セレクタ定義 (POM Layer 1) | `src/maestro/elements/` | `<screen>.js` |
| サブフロー (POM Layer 2) | `src/maestro/subflows/` | `<action>.yaml` |
| テストフロー | `src/maestro/flows/<feature>/` | `<scenario>.yaml` |
| GraalJS ユーティリティ | `src/maestro/scripts/` | `<purpose>.js` |
| セレクタ一括ロード | `src/maestro/subflows/load-elements.yaml` | — |

## ディレクトリ構造

```
src/maestro/
├── config.yaml                     # Maestro ワークスペース設定
├── elements/                       # セレクタ定義 (GraalJS)
│   ├── login.js
│   ├── dashboard.js
│   ├── services.js
│   └── settings.js
├── subflows/                       # 再利用可能なアクション
│   ├── load-elements.yaml          # 全セレクタの一括ロード
│   ├── login.yaml                  # ログイン操作
│   ├── navigate.yaml               # ナビゲーション操作
│   └── setup-test-data.yaml        # テストデータ投入
├── scripts/                        # GraalJS ユーティリティ
│   ├── seed-data.js                # API 経由でシードデータ投入
│   └── cleanup-data.js             # API 経由でデータクリーンアップ
└── flows/                          # テストフロー (機能別)
    ├── auth/
    │   ├── login-success.yaml
    │   ├── login-failure.yaml
    │   └── signup.yaml
    ├── dashboard/
    │   ├── view-summary.yaml
    │   └── view-trends.yaml
    └── services/
        ├── list-services.yaml
        └── service-detail.yaml
```

## Page Object Model (POM) — 2 層アーキテクチャ

Maestro では **セレクタ層 (JS)** と **アクション層 (YAML サブフロー)** の 2 層で POM を実現する。

### 対応表: Playwright POM → Maestro POM

| Playwright | Maestro | 役割 |
|-----------|---------|------|
| `BasePage.ts` コンストラクタのロケーター定義 | `elements/<screen>.js` の `output.*` | セレクタの集中管理 |
| `LoginPage.login()` メソッド | `subflows/login.yaml` (`runFlow` + `env`) | 再利用可能な操作 |
| `auth.spec.ts` テストファイル | `flows/auth/login-success.yaml` | テストケース |

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

```javascript
// elements/dashboard.js
output.dashboard = {
  heading: 'dashboard_heading',
  summary: {
    totalServices: 'summary_total_services',
    totalUsage: 'summary_total_usage',
    totalCost: 'summary_total_cost'
  },
  trendChart: 'trend_chart_section'
}
```

**規約:**
- 名前空間: `output.<screen>.*` で画面ごとに分離する
- セレクタ値: `id:` (testTag / accessibilityIdentifier) で使用する識別子を格納する
- ネスト: 画面内のセクションは `output.<screen>.<section>.*` でグループ化する
- 命名: `snake_case` で `<screen>_<component>_<element>` 形式にする

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
- サブフローは `runScript` でセレクタを自己ロードする
- パラメータは `env` で外部から注入する (ハードコード禁止)
- 1 サブフロー = 1 操作単位 (ログイン、ナビゲーション等)
- **アサーション (`assertVisible` 等) はフロー側に書く**。サブフローに書かない

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

## セレクタ優先順位

| 優先度 | セレクタ | Android (Compose) | iOS (SwiftUI) | 例 |
|--------|---------|-------------------|---------------|----|
| 1 (推奨) | `id:` | `Modifier.testTag("...")` | `.accessibilityIdentifier("...")` | `id: "login_button"` |
| 2 | `text:` | 表示テキスト | 表示テキスト | `text: "ログイン"` |
| 3 (最終手段) | `index:` | 要素の位置 | 要素の位置 | `index: 0` |

### アプリ側のテスタビリティ実装

```kotlin
// Android: Jetpack Compose — Modifier.testTag を付与する
Text(
    text = "ダッシュボード",
    modifier = Modifier.testTag("dashboard_heading")
)

Button(
    onClick = { onLogin() },
    modifier = Modifier.testTag("login_button")
) {
    Text("ログイン")
}
```

```swift
// iOS: SwiftUI — .accessibilityIdentifier を付与する
Text("ダッシュボード")
    .accessibilityIdentifier("dashboard_heading")

Button("ログイン") { onLogin() }
    .accessibilityIdentifier("login_button")
```

## テストフロー記法

### 基本構造

```yaml
# flows/auth/login-success.yaml
appId: com.example.saasportal
tags:
  - smoke
  - auth
onFlowStart:
  - runScript: ../../scripts/seed-data.js
onFlowComplete:
  - runScript: ../../scripts/cleanup-data.js
---
- launchApp

- runFlow:
    file: ../../subflows/login.yaml
    env:
      EMAIL: "user@example.com"
      PASSWORD: "password123"

- assertVisible:
    id: "dashboard_heading"
```

### 主要コマンド

| カテゴリ | コマンド | 説明 |
|---------|---------|------|
| 起動 | `launchApp` | アプリを起動 (または前面に復帰) |
| タップ | `tapOn:` | 要素をタップする |
| 入力 | `inputText:` | テキストを入力する |
| クリア | `clearTextField` | 入力フィールドをクリアする |
| スクロール | `scroll` | 画面をスクロールする |
| アサーション | `assertVisible:` | 要素が表示されていることを検証する |
| アサーション | `assertNotVisible:` | 要素が非表示であることを検証する |
| サブフロー | `runFlow:` | 別のフローを実行する |
| スクリプト | `runScript:` | GraalJS スクリプトを実行する |
| リトライ | `retry:` | コマンド群をリトライする (最大 3 回) |
| 待機 | `extendedWaitUntil:` | カスタムタイムアウトで要素を待機する |

## Flaky テスト対策

### Maestro の組み込み安定化メカニズム

| メカニズム | 値 | 設定可否 |
|-----------|---|---------|
| 要素検索タイムアウト | 17 秒 (自動ポーリング) | ❌ ハードコード |
| タップ自動リトライ | 最大 2 回 | ❌ ハードコード |
| スクリーンショット差分閾値 | 0.5% ピクセル差 | ❌ ハードコード |
| `retry` ブロック | 最大 3 回 | ⚠️ 上限 3 固定 |
| アニメーション・遷移待機 | 自動検出 | ❌ 自動 |

### 17 秒タイムアウトの回避策

```yaml
# 方法 1: extendedWaitUntil (カスタムタイムアウト)
- extendedWaitUntil:
    visible:
      id: "data_loaded_indicator"
    timeout: 30000

# 方法 2: retry ブロック (実効 17s × 3 = 最大 51s)
- retry:
    times: 3
    commands:
      - assertVisible:
          id: "dashboard_heading"
```

### データ独立性の確保

```yaml
# ✅ Good: フローごとに独立したデータを用意する
onFlowStart:
  - runScript: ../../scripts/seed-data.js
onFlowComplete:
  - runScript: ../../scripts/cleanup-data.js

# ❌ Bad: グローバルなデータに依存する — 実行順序でテストが壊れる
```

### CI 環境での安定化

```bash
# Android エミュレータのアニメーションを無効化する
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

## GraalJS ユーティリティ

### HTTP API 呼び出し (テストデータ管理)

```javascript
// scripts/seed-data.js
// Maestro 組み込みの http オブジェクトを使用する
var BASE_URL = 'http://10.0.2.2:8000'  // Android エミュレータから DevContainer へ

var response = http.post(BASE_URL + '/api/test/seed', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant: { tenant_code: 'TEST_TENANT', tenant_name: 'テスト企業' },
    users: [{ email: 'user@example.com', password: 'password123', role: 'admin' }]
  })
})

if (response.status !== 200) {
  throw new Error('Seed failed: ' + response.status)
}

var data = json(response.body)
output.testTenantId = data.tenant_id
output.testUserId = data.user_id
```

**プラットフォーム別ホスト:**
- Android エミュレータ → `http://10.0.2.2:8000` (ホストマシンの `localhost` にマッピング)
- iOS シミュレータ → `http://localhost:8000` (直接アクセス可能)

### 注意事項

- GraalJS は ES6+ をサポートするが、**`const` / `let` の代わりに `var` を推奨**（Maestro の `output` スコープとの互換性のため）
- `http` オブジェクトと `json()` 関数は Maestro 組み込み (import 不要)
- `console.log()` でデバッグ出力可能

## config.yaml

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

**規約:**
- `flows` にはグロブパターンでフロー検出対象を指定する
- `continueOnFailure: false` で最初の失敗で停止する
- 開発中のフローには `wip` タグを付けて除外する

## テストパターン

### Good Example

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
# セレクタをロード
- runFlow:
    file: ../../subflows/load-elements.yaml

# ログイン (POM サブフロー)
- launchApp
- runFlow:
    file: ../../subflows/login.yaml
    env:
      EMAIL: "user@example.com"
      PASSWORD: "password123"

# ダッシュボードの表示を検証
- assertVisible:
    id: ${output.dashboard.heading}
- assertVisible:
    id: ${output.dashboard.summary.totalServices}

# データ読み込み完了を待機 (Flaky 対策)
- retry:
    times: 3
    commands:
      - assertVisible:
          id: ${output.dashboard.trendChart}
```

### Bad Example

```yaml
# ❌ POM 未使用、ハードコード、sleep 使用、text セレクタのみ
appId: com.example.saasportal
---
- launchApp
- tapOn: "メールアドレス"
- inputText: "user@example.com"
- tapOn: "パスワード"
- inputText: "password123"
- tapOn: "ログイン"
- scroll
- assertVisible: "ダッシュボード"
# ❌ text セレクタはローカライズで壊れる
# ❌ セレクタが分散していて変更に弱い
# ❌ テストデータのセットアップがない
```

## ファイル命名規約

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| セレクタ定義 | `<screen>.js` (lowercase) | `login.js`, `dashboard.js` |
| サブフロー | `<action>.yaml` (kebab-case) | `login.yaml`, `setup-test-data.yaml` |
| テストフロー | `<scenario>.yaml` (kebab-case) | `login-success.yaml`, `view-summary.yaml` |
| スクリプト | `<purpose>.js` (kebab-case) | `seed-data.js`, `cleanup-data.js` |
| タグ | `kebab-case` | `smoke`, `regression`, `auth`, `dashboard` |

## Testcontainers 統合 (CI パイプライン)

Maestro と Testcontainers は **異なるレイヤー** で動作するため、CI パイプラインで統合する。

```
CI/CD パイプライン
├─ Step 1: Testcontainers で MongoDB 起動 (クリーンな使い捨て DB)
├─ Step 2: FastAPI Backend を MONGO_URI 付きで起動
├─ Step 3: Android エミュレータ / iOS シミュレータを起動
├─ Step 4: Maestro テスト実行 (onFlowStart で API 経由シードデータ投入)
└─ Step 5: Testcontainers が MongoDB を自動破棄
```

## Validation

- 全フロー実行: `cd src/maestro && maestro test .`
- 特定フロー実行: `cd src/maestro && maestro test flows/auth/login-success.yaml`
- タグ指定実行: `cd src/maestro && maestro test . --include-tags=smoke`
- 要素の確認: `maestro studio` (インタラクティブ UI インスペクタ)
- ヘルスチェック: `maestro --version`
