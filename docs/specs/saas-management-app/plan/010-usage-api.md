---
id: task-010
title: "利用実績 API（登録・一括登録・一覧）"
execution: delegate
depends_on: [task-008, task-009]
parallel: false
---

# 利用実績 API（登録・一括登録・一覧）

## 概要

月次利用実績の登録（UPSERT）、一括登録、一覧取得の API を実装する。登録時に BillingService を使用して請求額を自動計算する。

## 作業内容

- `src/backend/Endpoints/UsageEndpoints.cs` を作成:
  - `GET /api/usages` — 利用実績一覧（フィルタ: contractId, customerId, productId, from, to）
  - `POST /api/usages` — 月次利用実績の登録（UPSERT）、請求額自動計算
  - `POST /api/usages/bulk` — 複数件の一括登録（1トランザクション内で処理）
- 登録処理:
  1. 契約IDから契約とプラン情報を取得
  2. BillingService.CalculateBillingAmount() で請求額を計算
  3. 同一契約・同一月のレコードが存在する場合は更新（UPSERT）
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠
- ビジネスルール BR-07 を実装
- トライアル中の契約の場合は請求額 = 0（BR-03）

## Acceptance Criteria

- [ ] 全3エンドポイントが動作すること
- [ ] 利用実績登録時に請求額が自動計算されること
- [ ] 同一契約・同一月の再登録で既存レコードが更新されること（UPSERT）
- [ ] 一括登録が1トランザクションで処理されること
- [ ] 一覧のフィルタ（顧客・製品・期間）が動作すること
- [ ] レスポンスに計算された請求額が含まれること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `RegisterUsage_CalculatesBillingAmount`
- `RegisterUsage_UpsertExistingRecord`
- `BulkRegister_AllSucceed_InOneTransaction`
- `BulkRegister_OneFails_RollbackAll`
- `GetUsages_FilterByPeriod`

### E2E テスト
- なし（task-021 で実施）
