# Task-05: 契約管理

## 概要

顧客ごとの契約情報（製品・プラン・ライセンス数・ステータス）の CRUD と、
プラン変更履歴の記録・表示を実装する。営業担当者は担当顧客のみ編集可能。

## スコープ

### バックエンド
- `app/schemas/contract.py` — ContractCreate, ContractUpdate, ContractResponse
- `app/schemas/contract_plan_history.py` — ContractPlanHistoryResponse
- `app/services/contract_service.py` — 契約 CRUD、変更履歴記録、ステータス管理
- `app/routers/contracts.py` — `GET/POST /api/contracts`, `GET/PUT /api/contracts/{id}`, `GET /api/contracts/{id}/history`

### フロントエンド
- `pages/ContractsPage.tsx` — 契約管理ページ（一覧 + 詳細）
- `components/Contract/ContractList.tsx` — 契約一覧テーブル（検索・フィルタ）
- `components/Contract/ContractForm.tsx` — 契約登録/編集フォーム
- `components/Contract/ContractDetail.tsx` — 契約詳細（変更履歴含む）
- `components/Contract/RenewalAlert.tsx` — 更新時期アラート表示
- `hooks/useContracts.ts` — 契約データフェッチ
- `api/contracts.ts` — 契約 API クライアント
- `types/api.ts` に Contract, ContractPlanHistory 型を追加

### データモデル
- `contracts` コレクション — `(customer_id, product_id, status)` 複合インデックス
- `contract_plan_history` コレクション — 変更履歴

## Acceptance Criteria

- [ ] AC-05-01: 管理者が「ABC商事」×「CloudCRM Pro」×「Enterprise」プランで契約を登録すると、契約一覧に表示される
- [ ] AC-05-02: 営業担当者が担当顧客の契約ライセンス数を 150 から 200 に変更すると、contract_plan_history に変更履歴が記録され、契約詳細画面に履歴が表示される
- [ ] AC-05-03: 営業担当者が担当外顧客の契約を編集しようとすると、403 権限エラーが返る
- [ ] AC-05-04: 契約更新日が 30 日以内の契約には更新時期アラートバッジが表示される
- [ ] AC-05-05: 契約ステータスを「active」から「renewing」に変更すると、一覧のステータス表示が更新される

## 依存関係
- 前提タスク: Task-03（プランマスタ — current_plan_id の参照先）、Task-04（顧客マスタ — customer_id の参照先）
- 並行実行: 不可（Task-03, Task-04 両方の完了後に開始）

## 実装メモ
- 同一顧客・同一製品で `status = active` の契約は 1 件まで（仕様 03-data-model.md）
- 契約変更時は必ず `contract_plan_history` にスナップショットを記録
- `primary_use_case` は `sales_ops | customer_support | analytics | integration | other` の enum
- 営業担当者の参照/更新範囲は `customers.assigned_sales_user_id` を基点に判定
- 管理者は全件閲覧・更新可能
- Phase 1 では月中単価変更の自動按分は行わない
