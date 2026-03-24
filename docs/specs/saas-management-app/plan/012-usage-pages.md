---
id: task-012
title: "利用実績画面（一覧・登録・請求額プレビュー）"
execution: delegate
depends_on: [task-010, task-005]
parallel: false
---

# 利用実績画面（一覧・登録・請求額プレビュー）

## 概要

月次利用実績の一覧表示、実績登録（リアルタイム請求額プレビュー付き）の画面を実装する。

## 作業内容

- `src/frontend/src/pages/UsagePage.tsx` — 利用実績画面
  - テーブル形式で顧客名・製品名・プラン・月・利用量・請求額を表示
  - フィルタ（顧客・製品・期間）
  - 「実績登録」ボタン → モーダル
- 実績登録フォーム:
  - 契約選択（顧客名 / 製品名 / プラン名のプルダウン）
  - 対象月入力（YYYY-MM）
  - 利用量入力
  - **リアルタイム請求額プレビュー**（フロントエンドでの簡易計算表示）
    - 基本料 + 超過分の内訳を表示
    - 注: 確定値はサーバーサイドで計算
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] 利用実績一覧が表示されること
- [ ] フィルタ（顧客・製品・期間）が動作すること
- [ ] 実績登録時に利用量を入力すると請求額プレビューがリアルタイム表示されること
- [ ] プレビューに基本料と超過分の内訳が表示されること
- [ ] 登録成功後に一覧に反映されること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `UsagePage_RendersList`
- `UsageForm_ShowsBillingPreview`

### E2E テスト
- なし（task-021 で実施）
