# Task-08: 管理者機能（ユーザー管理・監査ログ）

## 概要

管理者専用のユーザー管理機能と監査ログ閲覧機能を実装する。
マスタ管理画面の管理者専用タブとして提供する。

## スコープ

### バックエンド
- `app/schemas/user.py` に UserCreate, UserUpdate を追加
- `app/schemas/audit_log.py` — AuditLogResponse
- `app/services/user_service.py` にユーザー CRUD（作成・無効化・ロール変更）を追加
- `app/services/audit_service.py` — 監査ログ記録・検索
- `app/routers/users.py` — `GET/POST /api/users`, `PUT/DELETE /api/users/{id}`
- `app/routers/audit_logs.py` — `GET /api/audit-logs`（フィルタ: resource_type, action, 日付範囲）

### フロントエンド
- `components/Master/UserTab.tsx` — ユーザー一覧・登録・無効化
- `components/Master/UserForm.tsx` — ユーザー登録フォーム（email, display_name, role, password）
- `components/Master/AuditLogTab.tsx` — 監査ログ一覧（フィルタ・検索）
- `hooks/useUsers.ts` — ユーザーデータフェッチ
- `hooks/useAuditLogs.ts` — 監査ログデータフェッチ
- `api/users.ts` — ユーザー API クライアント
- `api/auditLogs.ts` — 監査ログ API クライアント
- `types/api.ts` に AuditLog 型を追加

### データモデル
- `users` コレクション（Task-01 で作成済み）
- `audit_logs` コレクション

## Acceptance Criteria

- [ ] AC-08-01: 管理者がメールアドレス「sales01@example.com」・表示名「田中太郎」・ロール「sales」を指定してユーザーを登録すると、ユーザー一覧に表示される
- [ ] AC-08-02: 管理者がユーザーを無効化すると、そのユーザーが次回ログインを試みた際に認証エラーが返る
- [ ] AC-08-03: 管理者が監査ログ画面を開くと、操作履歴（実行者・操作種別・対象・日時）が時系列で表示される
- [ ] AC-08-04: 営業担当者（sales ロール）がユーザー管理タブまたは監査ログタブにアクセスすると、タブが表示されないか権限エラーが表示される

## 依存関係
- 前提タスク: Task-01（認証基盤 — users コレクション、認証機構が必要）
- 並行実行: Task-02, Task-04 と並行可能

## 実装メモ
- ユーザー作成時のパスワードは bcrypt でハッシュ化して保存
- ユーザー無効化は `is_active = false`。次回 API アクセス時に get_current_user で弾く
- 監査ログの記録対象: マスタ CRUD（create/update/deactivate）、取込確定（import_confirm）、再取込（import_replace）、ユーザー管理操作
- 監査ログの `before` / `after` フィールドには変更前後のスナップショットを記録
- 監査ログ記録はサービス層で実装し、各ルーターから呼び出す
- 初期実装では監査ログ記録を audit_service に集約し、他タスクの実装完了後に各サービスからの呼び出しを追加する
