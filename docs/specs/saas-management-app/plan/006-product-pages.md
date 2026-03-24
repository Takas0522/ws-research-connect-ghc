---
id: task-006
title: "製品管理画面（一覧・詳細・登録・編集）"
execution: delegate
depends_on: [task-003, task-005]
parallel: true
---

# 製品管理画面（一覧・詳細・登録・編集）

## 概要

製品マスタの一覧表示、詳細表示（プラン一覧含む）、新規登録、編集、プラン追加の画面を実装する。

## 作業内容

- `src/frontend/src/pages/ProductsPage.tsx` — 製品一覧画面
  - テーブル形式で製品名・カテゴリ・ステータス・契約数を表示
  - ステータスフィルタ
  - 「製品追加」ボタン → モーダル
  - 行クリックで詳細ページへ遷移
- `src/frontend/src/pages/ProductDetailPage.tsx` — 製品詳細画面
  - 製品基本情報の表示・編集
  - プラン一覧の表示（月額基本料・従量単価・無料枠・年契割引）
  - 「プラン追加」ボタン → モーダル
  - 「戻る」ナビゲーション
- 製品登録・編集フォーム（モーダル）
- プラン登録フォーム（モーダル）
- ローディング状態・エラー状態の UI 表示
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] 製品一覧が API から取得したデータで表示されること
- [ ] ステータスフィルタが動作すること
- [ ] 製品追加モーダルで新規製品を登録でき、一覧に反映されること
- [ ] 製品詳細画面でプラン一覧が表示されること
- [ ] プラン追加モーダルでプランを登録でき、詳細画面に反映されること
- [ ] 製品編集が動作すること
- [ ] ローディング中とエラー時の UI が表示されること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `ProductsPage_RendersList`
- `ProductDetailPage_RendersPlans`

### E2E テスト
- なし（task-021 で実施）
