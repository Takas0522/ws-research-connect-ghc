---
id: task-008
title: "契約 API（CRUD・プラン変更・解約・変更履歴）"
execution: delegate
depends_on: [task-002]
parallel: true
---

# 契約 API（CRUD・プラン変更・解約・変更履歴）

## 概要

契約の一覧取得・新規登録・プラン変更・解約・変更履歴表示の API を実装する。プラン変更と解約はトランザクション内で変更履歴を自動記録する。

## 作業内容

- `src/backend/Endpoints/ContractEndpoints.cs` を作成:
  - `GET /api/contracts` — 契約一覧（顧客名・製品名・プラン名を含む、フィルタ対応）
  - `POST /api/contracts` — 契約新規登録（アクティブ契約の重複チェック、planId が productId に属するか検証）
  - `PUT /api/contracts/{id}/plan` — プラン変更（トランザクション: 契約更新 + ContractHistory 作成）
  - `POST /api/contracts/{id}/cancel` — 解約（トランザクション: ステータス・end_date 更新 + ContractHistory 作成）
  - `GET /api/contracts/{id}/history` — 契約変更履歴の取得
- Program.cs でエンドポイントを `MapGroup` で登録
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠
- ビジネスルール BR-04〜BR-06 を実装

## Acceptance Criteria

- [ ] 全5エンドポイントが動作すること
- [ ] 契約一覧でフィルタ（customerId, productId, status）が動作すること
- [ ] 同一顧客・同一製品のアクティブ契約の重複登録時に 409 が返ること
- [ ] planId が productId に属さない場合に 400 が返ること
- [ ] プラン変更時に ContractHistory が自動作成されること
- [ ] 解約時に status が `cancelled` に変更され、end_date が設定されること
- [ ] 解約時に ContractHistory が自動作成されること
- [ ] 変更履歴が時系列で取得できること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `GetContracts_ReturnsFilteredList`
- `CreateContract_WithValidData_Returns201`
- `CreateContract_DuplicateActiveContract_Returns409`
- `CreateContract_PlanNotBelongToProduct_Returns400`
- `ChangePlan_CreatesHistory`
- `CancelContract_UpdatesStatusAndCreatesHistory`
- `GetHistory_ReturnsChronologicalOrder`

### E2E テスト
- なし（task-021 で実施）
