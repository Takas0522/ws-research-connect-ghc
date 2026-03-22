---
id: task-004
title: "顧客 API（CRUD）"
execution: delegate
depends_on: [task-002]
parallel: true
---

# 顧客 API（CRUD）

## 概要

顧客マスタの CRUD API エンドポイントを実装する。

## 作業内容

- `src/backend/Endpoints/CustomerEndpoints.cs` を作成:
  - `GET /api/customers` — 顧客一覧（アクティブ契約数・月額合計を含む）
  - `GET /api/customers/{id}` — 顧客詳細（契約一覧・最新利用実績を含む）
  - `POST /api/customers` — 顧客新規登録（顧客コード重複チェック）
  - `PUT /api/customers/{id}` — 顧客更新
- Program.cs でエンドポイントを `MapGroup` で登録
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠
- バリデーション: 顧客コードの重複不可、必須項目チェック
- 顧客詳細では契約中の製品・プランと最新月の利用実績を含む
- 読み取りクエリには `AsNoTracking()` を使用

## Acceptance Criteria

- [ ] 全4エンドポイントが動作すること
- [ ] 顧客コードの重複登録時に 409 が返ること
- [ ] 顧客一覧でアクティブ契約数と月額合計が含まれること
- [ ] 顧客詳細で契約一覧と最新利用実績が含まれること
- [ ] 存在しない顧客IDで 404 が返ること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `GetCustomers_ReturnsAllCustomers`
- `GetCustomer_WithValidId_ReturnsCustomerWithContracts`
- `GetCustomer_WithInvalidId_Returns404`
- `CreateCustomer_WithValidData_Returns201`
- `CreateCustomer_WithDuplicateCode_Returns409`

### E2E テスト
- なし（Phase 1 完了時に画面テストで検証）
