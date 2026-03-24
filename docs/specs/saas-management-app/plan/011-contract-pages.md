---
id: task-011
title: "契約管理画面（一覧・詳細・プラン変更・解約）"
execution: delegate
depends_on: [task-008, task-005]
parallel: true
---

# 契約管理画面（一覧・詳細・プラン変更・解約）

## 概要

契約の一覧表示、詳細表示（変更履歴・利用実績含む）、新規登録、プラン変更、解約の画面を実装する。

## 作業内容

- `src/frontend/src/pages/ContractsPage.tsx` — 契約一覧画面
  - テーブル形式で顧客名・製品名・プラン名・契約形態・ステータスを表示
  - フィルタ（顧客・製品・ステータス）
  - 「新規契約」ボタン → モーダル
  - 行クリックで詳細ページへ遷移
- `src/frontend/src/pages/ContractDetailPage.tsx` — 契約詳細画面
  - 契約基本情報
  - 変更履歴（時系列表示）
  - 利用実績（直近数ヶ月）
  - 「プラン変更」ボタン → モーダル（変更先プラン選択 + 変更理由入力）
  - 「解約」ボタン → モーダル（解約日 + 解約理由入力）
- 新規契約登録フォーム（顧客・製品・プラン選択、契約形態、開始日）
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] 契約一覧が API から取得したデータで表示されること
- [ ] フィルタが動作すること
- [ ] 新規契約登録で製品選択時にプラン選択肢が動的に変わること
- [ ] 契約詳細画面で変更履歴が表示されること
- [ ] プラン変更後に変更履歴が即座に反映されること
- [ ] 解約後にステータスが「解約済み」に変わること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `ContractsPage_RendersList`
- `ContractDetailPage_RendersHistory`

### E2E テスト
- なし（task-021 で実施）
