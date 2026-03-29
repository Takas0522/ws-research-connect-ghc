# Task-05: Android プロジェクトセットアップ & 認証画面

## 概要

Android アプリ（Kotlin + Jetpack Compose）のプロジェクトを初期化し、
DI (Hilt)、API クライアント (Retrofit + OkHttp)、トークン管理 (DataStore) の基盤を構築する。
その上にログイン画面とサインアップ画面を実装する。

## スコープ

### モバイル（Android）

**プロジェクト初期化:**
- `src/mobile/android/` に Kotlin + Jetpack Compose プロジェクトを作成
- Gradle 設定（`build.gradle.kts`）— 依存ライブラリの追加
- Hilt DI セットアップ (`SaaSPortalApp.kt`, `AppModule.kt`, `NetworkModule.kt`)

**基盤レイヤー:**
- `data/remote/interceptor/AuthInterceptor.kt` — OkHttp Interceptor で JWT を自動付与
- `data/local/TokenDataStore.kt` — DataStore でアクセストークン・リフレッシュトークンを保存
- `data/remote/api/AuthApi.kt` — Retrofit インターフェース（signup, login, refresh, me）
- `data/remote/dto/AuthDto.kt` — API レスポンス DTO
- `domain/model/PortalUser.kt` — ドメインモデル
- `domain/repository/AuthRepository.kt` — Repository インターフェース
- `data/repository/AuthRepositoryImpl.kt` — Repository 実装

**認証画面:**
- `ui/auth/LoginScreen.kt` — メールアドレス + パスワード入力、ログインボタン、サインアップ遷移リンク
- `ui/auth/SignUpScreen.kt` — メールアドレス + パスワード + 表示名 + テナントコード入力、登録ボタン
- `ui/auth/AuthViewModel.kt` — 認証状態管理（`sealed interface AuthUiState`）
- `ui/navigation/NavGraph.kt` — Navigation Compose（認証フロー → メイン画面）

**ナビゲーション基盤:**
- `ui/navigation/NavGraph.kt` — Navigation Compose + ボトムナビゲーション（3 タブ: ダッシュボード / アプリ / 設定）のスケルトン
- `MainActivity.kt` — `Scaffold` + `NavigationBar` (Material3) 構成
- 各タブの画面は後続タスク（Task-06, 07, 08）で実装。スケルトンではプレースホルダー `Text` を配置

**共通コンポーネント:**
- `ui/components/LoadingIndicator.kt` — ローディング表示
- `ui/components/ErrorMessage.kt` — エラーメッセージ + リトライボタン

**testTag 付与対象:**
- `login_email_field`, `login_password_field`, `login_button`, `login_error_text`
- `signup_email_field`, `signup_password_field`, `signup_display_name_field`, `signup_tenant_code_field`, `signup_button`

### バックエンド

- なし（Task-02 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-05-01: Android アプリを起動するとログイン画面が表示され、メールアドレスとパスワードの入力フィールド、ログインボタンが見える
- [ ] AC-05-02: ログイン画面で「アカウント作成」リンクをタップするとサインアップ画面に遷移し、メールアドレス・パスワード・表示名・テナントコードの入力フィールドが見える
- [ ] AC-05-03: 正しい認証情報でログインすると、トークンが DataStore に保存され、ダッシュボード画面（空のプレースホルダー）に遷移する
- [ ] AC-05-04: 誤った認証情報でログインすると、ログイン画面にエラーメッセージが表示される
- [ ] AC-05-05: サインアップ画面で有効なテナントコードと情報を入力して登録すると、自動的にログイン状態になりダッシュボード画面に遷移する
- [ ] AC-05-06: アプリを再起動した際、保存済みのトークンが有効であればログイン画面をスキップしてダッシュボード画面に遷移する
- [ ] AC-05-07: メイン画面にボトムナビゲーション（ダッシュボード / アプリ / 設定の 3 タブ）が表示され、タブ切り替えが動作する（各画面はプレースホルダー）

## 依存関係

- 前提タスク: Task-02（Portal Auth Backend API）
- 並行実行: Task-03, Task-04 と並行実行可能

## 実装メモ

- API のベース URL は `BuildConfig` または環境変数で設定する（DevContainer → `http://10.0.2.2:8000`）
- トークン保存には `androidx.datastore:datastore-preferences` を使用する
- Hilt の `@HiltViewModel` で ViewModel に Repository を注入する
- Navigation Compose の `NavGraph` でログイン状態に応じて `startDestination` を切り替える
- 入力バリデーション: email 形式チェック、パスワード最低 8 文字、テナントコード必須
- すべてのインタラクティブ要素に `Modifier.testTag()` を付与する（Maestro E2E テスト対応）
- ログイン画面・サインアップ画面で Loading 中はボタンを無効化し、`CircularProgressIndicator` を表示する
