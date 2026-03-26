# Task-04: 顧客マスタ CRUD

## 概要

顧客（契約主体）の CRUD を実装する。担当営業の割当・連絡先管理を含む。
営業担当者のデータアクセス範囲は `assigned_sales_user_id` で制御される。

## スコープ

### バックエンド
- `app/schemas/customer.py` — CustomerCreate, CustomerUpdate, CustomerResponse
- `app/services/customer_service.py` — 顧客の CRUD（is_active による論理削除）
- `app/routers/customers.py` — `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}`

### フロントエンド
- `components/Master/CustomerTab.tsx` — 顧客一覧・登録・編集・削除
- `components/Master/CustomerForm.tsx` — 顧客登録/編集フォーム（担当営業選択含む）
- `hooks/useCustomers.ts` — 顧客データフェッチ
- `api/customers.ts` — 顧客 API クライアント
- `types/api.ts` に Customer 型を追加

### データモデル
- `customers` コレクション — `customer_code` ユニーク
- `customers.assigned_sales_user_id` インデックス

## Acceptance Criteria

- [ ] AC-04-01: 管理者が顧客コード「CUST001」・顧客名「ABC商事」・担当営業を指定して登録すると、顧客一覧に表示される
- [ ] AC-04-02: 管理者が既存顧客の担当営業を別のユーザーに変更すると、顧客詳細に反映される
- [ ] AC-04-03: 既に登録済みの顧客コード「CUST001」で再度登録しようとすると、エラーメッセージが表示される
- [ ] AC-04-04: 管理者が顧客を無効化すると、顧客一覧に表示されなくなる

## 依存関係
- 前提タスク: Task-01（認証基盤 — assigned_sales_user_id で users を参照）
- 並行実行: Task-02, Task-08 と並行可能

## 実装メモ
- 担当営業の選択肢は `users` コレクションから `role = sales` かつ `is_active = true` のユーザーを取得
- 顧客の削除は `is_active = false` の論理無効化
- マスタ管理画面は admin ロール専用だが、顧客データ自体は契約管理画面等から sales ロールも参照する
- `contact_person`, `notes` はオプショナルフィールド
