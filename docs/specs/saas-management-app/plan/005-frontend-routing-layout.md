---
id: task-005
title: "フロントエンド ルーティング・レイアウト・共通コンポーネント"
execution: delegate
depends_on: []
parallel: true
---

# フロントエンド ルーティング・レイアウト・共通コンポーネント

## 概要

React Router によるページルーティング、共通レイアウト（ナビバー）、再利用可能な共通コンポーネントを構築する。

## 作業内容

- `react-router-dom` をインストール
- `src/frontend/src/App.tsx` を React Router 構成に書き換え
- ルーティング設定:
  - `/` → ダッシュボード（プレースホルダー）
  - `/products` → 製品一覧
  - `/products/:id` → 製品詳細
  - `/customers` → 顧客一覧
  - `/customers/:id` → 顧客詳細
  - `/contracts` → 契約一覧
  - `/contracts/:id` → 契約詳細
  - `/usages` → 利用実績
  - `/trials` → トライアル
- `src/frontend/src/components/Layout.tsx` — 共通レイアウト（ナビバー + コンテンツ領域）
- `src/frontend/src/components/DataTable.tsx` — テーブルコンポーネント
- `src/frontend/src/components/FormField.tsx` — フォーム入力コンポーネント
- `src/frontend/src/components/Modal.tsx` — モーダルダイアログ
- `src/frontend/src/components/StatusBadge.tsx` — ステータスバッジ
- `src/frontend/src/components/Card.tsx` — KPI カード
- `src/frontend/src/types/api.ts` — API レスポンスの TypeScript 型定義（全エンティティ）
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠
- Tailwind CSS v4 でスタイリング
- ナビバーはレスポンシブ対応（モバイルはハンバーガーメニュー）

## Acceptance Criteria

- [ ] 全ルートが定義されていて画面遷移が動作すること
- [ ] ナビバーが全ページで表示され、現在のページがハイライトされること
- [ ] 各共通コンポーネントがプロパティの型定義を持つこと
- [ ] TypeScript 型定義が API 仕様と一致すること
- [ ] `npm run build` が成功すること
- [ ] レスポンシブ対応（モバイル幅でハンバーガーメニューが動作）
- [ ] 既存の App.test.tsx を新構成に合わせて更新すること

## テスト

### ユニットテスト
- `Layout_RendersNavigation`
- `StatusBadge_RendersCorrectColor`

### E2E テスト
- なし
