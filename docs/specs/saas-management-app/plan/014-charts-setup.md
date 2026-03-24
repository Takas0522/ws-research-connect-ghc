---
id: task-014
title: "recharts 導入とチャートコンポーネント"
execution: delegate
depends_on: [task-005]
parallel: true
---

# recharts 導入とチャートコンポーネント

## 概要

ダッシュボードや詳細画面で使用するグラフ描画のため、recharts ライブラリを導入し、再利用可能なチャートコンポーネントを作成する。

## 作業内容

- `recharts` をインストール
- `src/frontend/src/components/charts/` ディレクトリに以下を作成:
  - `LineChart.tsx` — 折れ線グラフ（月次売上推移、利用量推移用）
  - `BarChart.tsx` — 棒グラフ（顧客別利用量用）
  - `PieChart.tsx` — 円グラフ（製品別売上比率用）
- 各コンポーネントは TypeScript の Props 型定義を持つ
- Tailwind CSS と調和するカラーパレットを設定
- レスポンシブ対応（`ResponsiveContainer` を使用）
- ツールチップ・凡例を標準装備

## Acceptance Criteria

- [ ] recharts がインストールされていること
- [ ] LineChart, BarChart, PieChart が正しくレンダリングされること
- [ ] レスポンシブ対応でコンテナサイズに追従すること
- [ ] 各コンポーネントが Props で型安全にデータを受け取ること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `LineChart_RendersWithData`
- `PieChart_RendersWithData`

### E2E テスト
- なし
