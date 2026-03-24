---
id: task-016
title: "顧客詳細画面に利用量・請求額グラフ追加"
execution: delegate
depends_on: [task-007, task-014]
parallel: true
---

# 顧客詳細画面に利用量・請求額グラフ追加

## 概要

顧客詳細画面に、契約ごとの利用量推移と請求額推移のグラフを追加する。

## 作業内容

- `src/frontend/src/pages/CustomerDetailPage.tsx` を拡張:
  - **利用量推移**（BarChart）: 製品別の月次利用量を棒グラフで表示（直近3ヶ月分）
  - **請求額推移**（LineChart）: 月次請求額合計を折れ線グラフで表示（直近3ヶ月分）
- 顧客詳細 API のレスポンスから利用実績データを取得してグラフ描画
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] 利用量推移の棒グラフが製品別に表示されること
- [ ] 請求額推移の折れ線グラフが表示されること
- [ ] データがない場合に適切なメッセージが表示されること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `CustomerDetailPage_RendersUsageChart`

### E2E テスト
- なし
