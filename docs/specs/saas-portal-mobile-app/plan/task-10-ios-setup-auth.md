# Task-10: iOS プロジェクトセットアップ & 認証画面

## 概要

iOS アプリ（Swift + SwiftUI）のプロジェクトを初期化し、
API クライアント（URLSession + JWT）、トークン管理（Keychain）、ナビゲーション基盤を構築する。
その上にログイン画面とサインアップ画面を実装する。

## スコープ

### モバイル（iOS）

**プロジェクト初期化:**
- `src/mobile/ios/SaaSPortal/` に Swift + SwiftUI プロジェクトを作成
- Xcode プロジェクト設定（`SaaSPortal.xcodeproj`）
- Swift Package Manager で依存ライブラリを追加

**基盤レイヤー:**
- `Services/APIClient.swift` — URLSession ラッパー（JWT 自動付与、Snake Case デコード）
- `Utilities/KeychainHelper.swift` — Keychain によるアクセストークン・リフレッシュトークンの安全な保存
- `Services/AuthService.swift` — 認証 API 呼び出し（signup, login, refresh, me）
- `Models/PortalUser.swift` — ユーザーモデル（Codable）
- `Models/Tenant.swift` — テナントモデル（Codable）
- `ViewModels/AuthViewModel.swift` — 認証状態管理（`@Observable`, `AuthUiState` sealed enum）

**認証画面:**
- `Views/Auth/LoginView.swift` — メールアドレス + パスワード入力、ログインボタン、サインアップ遷移リンク
- `Views/Auth/SignUpView.swift` — メールアドレス + パスワード + 表示名 + テナントコード入力、登録ボタン

**ナビゲーション基盤:**
- `ContentView.swift` — 認証状態に応じた画面切り替え（ログイン or メイン画面）
- メイン画面: `TabView` による 3 タブ構成（ダッシュボード / アプリ / 設定）のスケルトン

**共通コンポーネント:**
- `Views/Components/LoadingView.swift` — ローディング表示
- `Views/Components/ErrorView.swift` — エラーメッセージ + リトライボタン

**accessibilityIdentifier 付与対象:**
- `login_email_field`, `login_password_field`, `login_button`, `login_error_text`
- `signup_email_field`, `signup_password_field`, `signup_display_name_field`, `signup_tenant_code_field`, `signup_button`
- `tab_dashboard`, `tab_services`, `tab_settings`

### バックエンド

- なし（Task-02 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-10-01: iOS アプリを起動するとログイン画面が表示され、メールアドレスとパスワードの入力フィールド、ログインボタンが見える
- [ ] AC-10-02: ログイン画面で「アカウント作成」リンクをタップするとサインアップ画面に遷移し、メールアドレス・パスワード・表示名・テナントコードの入力フィールドが見える
- [ ] AC-10-03: 正しい認証情報でログインすると、トークンが Keychain に保存され、TabView（3 タブ）のダッシュボードタブに遷移する
- [ ] AC-10-04: 誤った認証情報でログインすると、ログイン画面にエラーメッセージが表示される
- [ ] AC-10-05: サインアップ画面で有効なテナントコードと情報を入力して登録すると、自動的にログイン状態になりダッシュボードタブに遷移する
- [ ] AC-10-06: アプリを再起動した際、Keychain に保存済みのトークンが有効であればログイン画面をスキップしてダッシュボードタブに遷移する

## 依存関係

- 前提タスク: Task-02（Portal Auth Backend API）
- 並行実行: Task-03, Task-04, Task-05 と並行実行可能

## 実装メモ

- API のベース URL は `ProcessInfo.processInfo.environment["API_BASE_URL"]` で設定する（デフォルト: `http://localhost:8000`）
- iOS シミュレータから DevContainer の Backend には `http://localhost:8000` で直接アクセス可能
- Keychain には `kSecClassGenericPassword` で `access_token` / `refresh_token` を保存する
- `@Observable` マクロ (iOS 17+) で ViewModel を実装する
- `ContentView` で `authViewModel.isAuthenticated` に応じて `LoginView` / `MainTabView` を切り替える
- 入力バリデーション: email 形式チェック、パスワード最低 8 文字、テナントコード必須
- すべてのインタラクティブ要素に `.accessibilityIdentifier()` を付与する（Maestro E2E テスト対応）
- `#Preview` マクロでプレビュー可能にする
