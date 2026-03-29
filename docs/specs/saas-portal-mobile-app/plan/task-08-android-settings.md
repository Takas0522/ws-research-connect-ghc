# Task-08: Android 設定・プロフィール画面

## 概要

ユーザープロフィール表示、テナント情報表示、ログアウト機能を提供する設定画面を実装する。
ボトムナビゲーションの「設定」タブからアクセスする。

## スコープ

### モバイル（Android）

**画面:**
- `ui/settings/SettingsScreen.kt` — 設定メイン画面
  - ユーザー情報セクション: 表示名、メールアドレス、ロール（admin/member）
  - テナント情報セクション: テナント名、テナントコード、プランティア
  - ログアウトボタン
- `ui/settings/SettingsViewModel.kt` — 設定画面の UI 状態管理

**testTag 付与対象:**
- `settings_heading`
- `settings_user_name`, `settings_user_email`, `settings_user_role`
- `settings_tenant_name`, `settings_tenant_code`, `settings_plan_tier`
- `settings_logout_button`

### バックエンド

- なし（`/api/portal/auth/me` から取得する情報を使用）

## Acceptance Criteria

- [ ] AC-08-01: 設定画面にユーザーの表示名、メールアドレス、ロール（管理者 / メンバー）が表示される
- [ ] AC-08-02: 設定画面にテナント名、テナントコード、プランティア（enterprise 等）が表示される
- [ ] AC-08-03: ログアウトボタンをタップすると確認ダイアログが表示され、確認後にトークンが削除されログイン画面に遷移する
- [ ] AC-08-04: ボトムナビゲーションで「ダッシュボード」「アプリ」「設定」の 3 タブが表示され、タップで画面が切り替わる

## 依存関係

- 前提タスク: Task-05（Android 基盤 + 認証）
- 並行実行: Task-06, Task-07 と並行実行可能

## 実装メモ

- ユーザー情報は `/api/portal/auth/me` のレスポンスを使用する（AuthViewModel で取得済みの情報をキャッシュ）
- テナント情報は JWT ペイロードの `tenant_code` と、`/api/portal/auth/me` の拡張レスポンスから取得する
  - `me` エンドポイントのレスポンスに `tenant_name`, `plan_tier` を含める必要がある場合は、Task-02 のスキーマを拡張する
- ログアウト処理: DataStore のトークン削除 → NavGraph のスタートデスティネーションをログイン画面に戻す
- ボトムナビゲーションは `NavigationBar` (Material3) を使用する
- PoC ではプロフィール編集機能は含めない（表示のみ）
- 通知設定は Phase 1 で追加する
