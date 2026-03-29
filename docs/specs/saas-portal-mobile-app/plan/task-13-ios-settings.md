# Task-13: iOS 設定・プロフィール画面

## 概要

ユーザープロフィール表示、テナント情報表示、ログアウト機能、通知設定（Phase 1 追加 UI）を提供する設定画面を SwiftUI で実装する。

## スコープ

### モバイル（iOS）

**画面:**
- `Views/Settings/SettingsView.swift` — 設定メイン画面
  - ユーザー情報セクション: 表示名、メールアドレス、ロール（admin/member）
  - テナント情報セクション: テナント名、テナントコード、プランティア
  - 通知設定セクション（Phase 1 追加）: プッシュ通知 ON/OFF トグル（UI のみ、バックエンド連携は Phase 2）
  - ログアウトボタン
- `ViewModels/SettingsViewModel.swift` — 設定画面の UI 状態管理

**accessibilityIdentifier 付与対象:**
- `settings_heading`
- `settings_user_name`, `settings_user_email`, `settings_user_role`
- `settings_tenant_name`, `settings_tenant_code`, `settings_plan_tier`
- `settings_notification_toggle`
- `settings_logout_button`

### バックエンド

- なし（`/api/portal/auth/me` から取得する情報を使用）

## Acceptance Criteria

- [ ] AC-13-01: 設定画面にユーザーの表示名、メールアドレス、ロール（管理者 / メンバー）が表示される
- [ ] AC-13-02: 設定画面にテナント名、テナントコード、プランティア（enterprise 等）が表示される
- [ ] AC-13-03: 通知設定セクションにプッシュ通知の ON/OFF トグルが表示される（Phase 1 では UI のみ、実際の通知送信は Phase 2）
- [ ] AC-13-04: ログアウトボタンをタップすると確認アラートが表示され、確認後に Keychain のトークンが削除されログイン画面に遷移する

## 依存関係

- 前提タスク: Task-10（iOS 基盤 + 認証）
- 並行実行: Task-11, Task-12 と並行実行可能

## 実装メモ

- ユーザー情報は `/api/portal/auth/me` のレスポンスを使用する
- 設定画面は `Form` + `Section` で構成する
- 通知設定の状態は `UserDefaults` に保存する（Phase 2 でバックエンド連携に変更）
- ログアウト処理: `KeychainHelper.shared.deleteTokens()` → `authViewModel.isAuthenticated = false` → ログイン画面に戻る
- PoC ではプロフィール編集機能は含めない（表示のみ）
