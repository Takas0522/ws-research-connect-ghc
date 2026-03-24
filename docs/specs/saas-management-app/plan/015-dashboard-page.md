---
id: task-015
title: "ダッシュボード画面（KPI・売上推移・製品比率・顧客ランキング）"
execution: delegate
depends_on: [task-013, task-014]
parallel: false
---

# ダッシュボード画面（KPI・売上推移・製品比率・顧客ランキング）

## 概要

事業全体の俯瞰ビューとなるダッシュボード画面を実装する。KPI カード、売上推移グラフ、製品別売上比率、顧客ランキングを表示する。

## 作業内容

- `src/frontend/src/pages/DashboardPage.tsx` — ダッシュボード画面
  - **KPI カード**（Card コンポーネント使用）:
    - 月次売上合計（前月比%）
    - アクティブ契約数
    - トライアル KPI（Phase 4 で追加、この時点ではプレースホルダー）
  - **月次売上推移グラフ**（LineChart）:
    - 折れ線グラフ、製品別色分け、過去6ヶ月分
  - **製品別売上比率**（PieChart）:
    - 直近月の製品別円グラフ
  - **顧客別月額ランキング**:
    - 上位5社のリスト表示
- ダッシュボード API からデータを取得
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] KPI カードが正しい値を表示すること
- [ ] 前月比が計算されて表示されること
- [ ] 売上推移グラフが製品別に色分けされて表示されること
- [ ] 製品別売上比率の円グラフが表示されること
- [ ] 顧客別ランキングが月額合計の降順で表示されること
- [ ] ローディング状態が表示されること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `DashboardPage_RendersKPICards`
- `DashboardPage_RendersCharts`

### E2E テスト
- なし（task-021 で実施）
