---
id: task-007
title: "顧客管理画面（一覧・詳細・登録・編集）"
execution: delegate
depends_on: [task-004, task-005]
parallel: true
---

# 顧客管理画面（一覧・詳細・登録・編集）

## 概要

顧客マスタの一覧表示、詳細表示（契約一覧含む）、新規登録、編集の画面を実装する。

## 作業内容

- `src/frontend/src/pages/CustomersPage.tsx` — 顧客一覧画面
  - テーブル形式で顧客コード・顧客名・契約数・月額合計を表示
  - 「顧客追加」ボタン → モーダル
  - 行クリックで詳細ページへ遷移
- `src/frontend/src/pages/CustomerDetailPage.tsx` — 顧客詳細画面
  - 顧客基本情報の表示・編集
  - 契約中の製品・プラン一覧
  - 「戻る」ナビゲーション
- 顧客登録・編集フォーム（モーダル）
- ローディング状態・エラー状態の UI 表示
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] 顧客一覧が API から取得したデータで表示されること
- [ ] 顧客追加モーダルで新規顧客を登録でき、一覧に反映されること
- [ ] 顧客詳細画面で契約一覧が表示されること
- [ ] 顧客編集が動作すること
- [ ] 顧客コードの重複時にエラーメッセージが表示されること
- [ ] ローディング中とエラー時の UI が表示されること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `CustomersPage_RendersList`
- `CustomerDetailPage_RendersContracts`

### E2E テスト
- なし（task-021 で実施）
