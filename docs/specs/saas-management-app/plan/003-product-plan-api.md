---
id: task-003
title: "製品・課金プラン API（CRUD）"
execution: delegate
depends_on: [task-002]
parallel: true
---

# 製品・課金プラン API（CRUD）

## 概要

製品マスタと課金プランの CRUD API エンドポイントを実装する。

## 作業内容

- `src/backend/Endpoints/ProductEndpoints.cs` を作成:
  - `GET /api/products` — 製品一覧（プラン数・アクティブ契約数を含む）
  - `GET /api/products/{id}` — 製品詳細（プラン一覧を含む）
  - `POST /api/products` — 製品新規登録（名前重複チェック）
  - `PUT /api/products/{id}` — 製品更新
- `src/backend/Endpoints/PlanEndpoints.cs` を作成:
  - `POST /api/products/{productId}/plans` — プラン追加
  - `PUT /api/plans/{id}` — プラン更新
- Program.cs でエンドポイントを `MapGroup` で登録
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠
- バリデーション: 製品名の重複不可、必須項目チェック
- 読み取りクエリには `AsNoTracking()` を使用

## Acceptance Criteria

- [ ] 全6エンドポイントが動作すること
- [ ] 製品名の重複登録時に 409 が返ること
- [ ] 製品一覧でプラン数・アクティブ契約数が含まれること
- [ ] 製品詳細でプラン一覧が含まれること
- [ ] 存在しない製品IDで 404 が返ること
- [ ] `dotnet build` が成功すること
- [ ] OpenAPI ドキュメントにエンドポイントが反映されること

## テスト

### ユニットテスト
- `GetProducts_ReturnsAllProducts`
- `GetProduct_WithValidId_ReturnsProductWithPlans`
- `GetProduct_WithInvalidId_Returns404`
- `CreateProduct_WithValidData_Returns201`
- `CreateProduct_WithDuplicateName_Returns409`
- `CreatePlan_WithValidData_Returns201`

### E2E テスト
- なし（Phase 1 完了時に画面テストで検証）
