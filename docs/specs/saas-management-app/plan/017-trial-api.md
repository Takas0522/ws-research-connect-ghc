---
id: task-017
title: "トライアル API（CRUD・本契約転換・期限切れ処理）"
execution: delegate
depends_on: [task-008, task-009]
parallel: true
---

# トライアル API（CRUD・本契約転換・期限切れ処理）

## 概要

トライアル（無料試用）の CRUD、本契約への転換、期限切れ一括処理の API を実装する。BillingService にトライアル判定ロジックを統合する。

## 作業内容

- `src/backend/Endpoints/TrialEndpoints.cs` を作成:
  - `GET /api/trials` — トライアル一覧（残日数・ステータスを含む、フィルタ: status, customerId）
  - `POST /api/trials` — トライアル開始（アクティブなトライアルの重複チェック）
  - `POST /api/trials/{id}/convert` — 本契約転換（トランザクション: トライアル更新 + 新規契約作成）
  - `POST /api/trials/{id}/cancel` — トライアルキャンセル
  - `POST /api/trials/expire` — 期限切れトライアルの一括処理（バッチ用）
- BillingService にトライアル判定を追加:
  - 利用実績登録時に、対象契約がトライアル由来かどうかを判定
  - トライアル中の顧客の利用量は記録するが請求額は 0
- トライアル仕様は `docs/specs/saas-management-app/business/06-trial-feature.md` に準拠
- ステータス遷移ルールを厳守（進行中 → 転換済み/期限切れ/キャンセルのみ）

## Acceptance Criteria

- [ ] 全5エンドポイントが動作すること
- [ ] トライアル一覧で残日数が計算されて含まれること
- [ ] 同一顧客・同一製品のアクティブトライアル重複時に 409 が返ること
- [ ] 本契約転換時に新規契約が作成され、トライアルの converted_contract_id が設定されること
- [ ] 転換済み・期限切れ・キャンセルのトライアルに対する操作が拒否されること
- [ ] 期限切れ一括処理で end_date を過ぎたアクティブトライアルが expired に変更されること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `GetTrials_ReturnsRemainingDays`
- `CreateTrial_WithValidData_Returns201`
- `CreateTrial_DuplicateActive_Returns409`
- `ConvertTrial_CreatesContractAndUpdatesStatus`
- `ConvertTrial_AlreadyConverted_Returns400`
- `CancelTrial_UpdatesStatus`
- `ExpireTrials_UpdatesExpiredStatus`

### E2E テスト
- なし（task-021 で実施）
