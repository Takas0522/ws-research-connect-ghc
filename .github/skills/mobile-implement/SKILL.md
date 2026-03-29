---
name: mobile-implement
description: >-
  docs/specs/{feature}/plan/ の開発計画をもとに Android (Kotlin + Jetpack Compose) と
  iOS (Swift + SwiftUI) およびポータル Backend (FastAPI) の実装を行うスキル。
  並行実行可能なタスクは同時に進め、各実装後に批判的レビューを行う。
  testTag / accessibilityIdentifier を必ず付与し、Maestro E2E テストの実行を保証する。
  パイプライン: dev-plan → [mobile-implement] → mobile-unit-test → maestro-generate-test
  ⚠ このスキルは「[mobile-implement] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: mobile-implement, android, ios, kotlin, swift, compose, swiftui, mobile, docs/specs.
---

# モバイル実装スキル

`docs/specs/{feature}/plan/` の開発計画を入力とし、Android (Kotlin + Jetpack Compose)、
iOS (Swift + SwiftUI)、ポータル Backend (FastAPI + Motor) の実装を行う。

## 呼び出し規約

> **このスキルは `[mobile-implement] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[mobile-implement] saas-portal-mobile-app` | ✅ 実行する |
| `モバイルアプリを実装して` | ❌ 実行しない — プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[mobile-implement] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/summary.md` が存在しない場合は、先に `[dev-plan] {feature}` を実行するよう案内する
3. `{feature}` が空の場合は、`docs/specs/` 配下の plan 付きディレクトリ一覧を提示する

## パイプラインにおける位置づけ

```
dev-plan → [mobile-implement] → mobile-unit-test → maestro-generate-test
                ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **このスキル (mobile-implement)**: 計画をもとに Android・iOS・Backend を実装する
3. **mobile-unit-test**: 実装に対して単体テストを構築する
4. **maestro-generate-test**: 計画の AC をもとに Maestro E2E テストを構築する

## このスキルを使うタイミング

- `docs/specs/{feature}/plan/` の開発計画に基づいて **モバイルアプリを実装** するとき
- **Android + iOS + ポータル Backend** をセットで構築するとき
- 計画の **Wave 単位で並行実装** を進めるとき

## 前提条件

- `docs/specs/{feature}/plan/` に dev-plan スキルの出力が存在すること
- `src/backend/` で `uv sync` が完了していること
- `src/mobile/android/` に Android プロジェクトがセットアップ済みであること
- `src/mobile/ios/` に iOS プロジェクトがセットアップ済みであること
- MongoDB が `localhost:27017` で起動中であること

## プロジェクト構造

### ポータル Backend

```
src/backend/app/
├── schemas/portal_*.py          # Pydantic v2 スキーマ
├── services/portal_*.py         # Motor CRUD サービス
├── routers/portal_*.py          # APIRouter (/api/portal/ プレフィックス)
└── dependencies/portal_auth.py  # テナントスコープ認証
```

### Android (Kotlin + Jetpack Compose)

```
src/mobile/android/app/src/main/kotlin/com/example/saasportal/
├── di/                          # Hilt DI モジュール
├── data/
│   ├── remote/api/              # Retrofit API インターフェース
│   ├── remote/dto/              # API レスポンス DTO
│   ├── remote/interceptor/      # AuthInterceptor (JWT 付与)
│   ├── repository/              # Repository 実装
│   └── local/                   # DataStore (トークン保存)
├── domain/
│   ├── model/                   # ドメインモデル
│   └── repository/              # Repository インターフェース
└── ui/
    ├── theme/                   # Material3 テーマ
    ├── navigation/NavGraph.kt   # Navigation Compose
    ├── components/              # 共通 Composable
    └── <feature>/               # 画面別 (Screen + ViewModel)
```

### iOS (Swift + SwiftUI)

```
src/mobile/ios/SaaSPortal/
├── Models/                      # Codable モデル
├── ViewModels/                  # @Observable ViewModel
├── Views/
│   ├── <Feature>/               # 画面別 View
│   └── Components/              # 共通コンポーネント
├── Services/
│   ├── APIClient.swift          # URLSession ラッパー (JWT 付与)
│   └── <Feature>Service.swift   # Protocol ベース Service
└── Utilities/
    └── KeychainHelper.swift     # Keychain によるトークン保存
```

## ワークフロー

### Step 0: 計画の読み込みと実装方針の確認

- `docs/specs/{feature}/plan/summary.md` を読み、全体構造を把握する
- 各タスクファイル (`task-NN-*.md`) のスコープと AC を確認する
- Wave 順序に従い、実装順序を決定する
- 仕様ドキュメント（画面設計・データモデル・認証設計）を確認する

### Step 1: 共通基盤の構築（未整備の場合）

以下が未作成の場合は最初に作成する。詳細は [references/common-infrastructure.md](./references/common-infrastructure.md) を参照。

- **Backend**: Portal 認証基盤 (`portal_auth.py`, `get_current_portal_user`)
- **Android**: DI モジュール (`NetworkModule`, `AppModule`)、AuthInterceptor、TokenDataStore
- **iOS**: APIClient、KeychainHelper

### Step 2: タスク単位の実装

各タスクで以下の順序で実装する。

#### 2-1. ポータル Backend (FastAPI)

1. Pydantic v2 スキーマ (`schemas/portal_*.py`) — `Create`, `Update`, `Response` を分離
2. Motor サービス (`services/portal_*.py`) — テナントスコープでフィルタリング
3. APIRouter (`routers/portal_*.py`) — `/api/portal/` プレフィックス、`Depends(get_current_portal_user)` 必須
4. `main.py` にルーター登録

#### 2-2. Android (Kotlin + Jetpack Compose)

1. DTO (`data/remote/dto/`) — `@SerializedName` で snake_case マッピング
2. Domain Model (`domain/model/`) — DTO → Domain 変換拡張関数
3. Retrofit API (`data/remote/api/`) — `suspend fun` で `@GET`, `@POST` 等
4. Repository (interface + impl) — `Flow` / `suspend` で非同期データ取得
5. ViewModel (`@HiltViewModel`) — `StateFlow` + `sealed interface UiState`
6. Composable Screen — Loading/Error/Success の 3 状態パターン
7. NavGraph にルート登録

#### 2-3. iOS (Swift + SwiftUI)

1. Codable Model (`Models/`) — `preview` static プロパティ付き
2. Service (Protocol + 実装) — `async throws` で API 呼び出し
3. ViewModel (`@Observable`) — `enum UiState` で状態管理
4. SwiftUI View — `.task {}` + `.refreshable {}` パターン
5. ContentView / NavigationStack にルート登録

### Step 3: テスタビリティの確保 (Maestro 対応)

**すべての操作対象 UI 要素に testTag / accessibilityIdentifier を付与する。**

```kotlin
// Android: Modifier.testTag
Button(
    onClick = { onLogin() },
    modifier = Modifier.testTag("login_button")
) { Text("ログイン") }
```

```swift
// iOS: .accessibilityIdentifier
Button("ログイン") { onLogin() }
    .accessibilityIdentifier("login_button")
```

命名規約: `<screen>_<component>_<element>` (snake_case)

### Step 4: 動作確認

- Backend: `cd src/backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Backend API ドキュメント: `http://localhost:8000/docs` で Portal エンドポイントを確認
- Android: `cd src/mobile/android && ./gradlew assembleDebug`
- iOS: `cd src/mobile/ios && xcodebuild build -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'`

### Step 5: 批判的レビュー（1回目）

以下の観点でレビューする。

- **テナントスコープ**: すべての Portal API で `tenant_id` フィルタリングが適用されているか
- **テスタビリティ**: 操作対象 UI 要素に testTag / accessibilityIdentifier が付与されているか
- **状態管理**: Android は `sealed interface UiState` + `StateFlow`、iOS は `@Observable` + `enum UiState` パターンか
- **型安全**: Android は `!!` 禁止、iOS は force unwrap 禁止
- **非同期**: Android は Coroutines、iOS は async/await を使用しているか
- **DI**: Android は Hilt、iOS は Protocol ベースのモック注入か
- **セキュリティ**: JWT トークンは Android は DataStore、iOS は Keychain で保存しているか

### Step 6: 修正と最終レビュー（必要な場合のみ・最大1回追加）

レビューで問題が見つかった場合は修正し、再度レビューする。2回のレビューを上限とする。

## コーディング規約

### ポータル Backend

- `.github/instructions/portal-backend.instructions.md` に準拠する
- API プレフィックス: `/api/portal/`
- コレクション名: `portal_*` プレフィックス
- 認証: `get_current_portal_user` / `require_portal_admin`

### Android

- `.github/instructions/kotlin-jetpack-compose.instructions.md` に準拠する
- `val` 優先、`var` 最小限
- `!!` (force unwrap) 禁止
- `@Preview` アノテーション必須
- `modifier: Modifier = Modifier` を末尾引数に

### iOS

- `.github/instructions/swift-swiftui.instructions.md` に準拠する
- `let` 優先、`var` 最小限
- `!` (force unwrap) 禁止
- `#Preview` マクロ必須
- Protocol ベースの Service 設計

## トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| Portal API が 401 を返す | JWT ペイロードに tenant_id がない | `create_portal_access_token` で tenant_id を含める |
| Android ビルドエラー (Hilt) | `@HiltViewModel` の設定不足 | `@AndroidEntryPoint` を Activity に追加、kapt/ksp 設定確認 |
| iOS API 接続失敗 | App Transport Security | `Info.plist` に `NSAllowsLocalNetworking` を追加 |
| testTag が Maestro で見つからない | `Modifier.testTag` の欠落 | 全操作対象要素に testTag を付与 |
| テナント間データ漏洩 | `tenant_id` フィルタ漏れ | すべての DB クエリに `tenant_id` 条件を追加 |

## 参照

- [共通基盤コード](./references/common-infrastructure.md) — Backend / Android / iOS の基盤コード

## 検証

- Backend lint: `cd src/backend && uv run ruff check . && uv run ruff format --check .`
- Backend 型チェック: `cd src/backend && uv run pyright`
- Android ビルド: `cd src/mobile/android && ./gradlew assembleDebug`
- Android lint: `cd src/mobile/android && ./gradlew ktlintCheck`
- iOS ビルド: `cd src/mobile/ios && xcodebuild build -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'`
