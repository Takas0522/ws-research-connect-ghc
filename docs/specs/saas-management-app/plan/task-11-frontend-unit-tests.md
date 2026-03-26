# Task-11: フロントエンド単体テスト

## 概要

カスタムフック・コンポーネントに対する Vitest + React Testing Library の単体テストを構築する。
API モック（MSW or fetch mock）を使用し、UI の振る舞いを検証する。

## スコープ

### テスト対象

| カテゴリ | 対象 | テスト内容 |
|----------|------|-----------|
| フック | `useAuth` | ログイン状態管理、トークン保存、ログアウト |
| フック | `useProducts` | 製品一覧取得、ローディング・エラー状態 |
| フック | `useMetricsDefinitions` | メトリクス取得 |
| フック | `usePlans` | プラン取得 |
| フック | `useCustomers` | 顧客一覧取得 |
| フック | `useContracts` | 契約一覧取得 |
| フック | `useImport` | CSV アップロード・確定フロー |
| フック | `useDashboard` | ダッシュボードデータ取得 |
| フック | `useUsers` | ユーザー一覧取得 |
| フック | `useAuditLogs` | 監査ログ取得 |
| コンポーネント | `LoginPage` | フォーム入力・送信・エラー表示 |
| コンポーネント | `ProductTab` / `ProductForm` | 製品一覧・登録フォーム |
| コンポーネント | `ContractList` / `ContractForm` | 契約一覧・登録フォーム |
| コンポーネント | `FileUpload` / `ImportPreview` | ファイル選択・プレビュー表示 |
| コンポーネント | `UsageSummaryCard` / `AlertList` | ダッシュボードカード・アラート |
| コンポーネント | `ProtectedRoute` | 未認証リダイレクト |

### テスト方針

- `vitest` + `@testing-library/react` + `jsdom`
- API 呼び出しは `vi.mock` または `vi.spyOn(global, 'fetch')` でモック
- 3 状態パターン（Loading / Error / Empty / Data）を各フック・ページで検証
- フォームの入力・送信・バリデーションエラー表示を検証
- アクセシビリティ: `getByRole`, `getByLabel` でのロケーター使用

## Acceptance Criteria

- [ ] AC-11-01: `useAuth` フックのテスト（ログイン・ログアウト・トークン管理）が通る
- [ ] AC-11-02: データフェッチフック（useProducts, useCustomers 等）のテストが通る
- [ ] AC-11-03: `LoginPage` のフォーム入力・送信・エラー表示テストが通る
- [ ] AC-11-04: マスタ管理コンポーネント（ProductTab, CustomerTab 等）のテストが通る
- [ ] AC-11-05: 契約管理コンポーネントのテストが通る
- [ ] AC-11-06: データ取込コンポーネント（FileUpload, ImportPreview）のテストが通る
- [ ] AC-11-07: ダッシュボードコンポーネントのテストが通る
- [ ] AC-11-08: `ProtectedRoute` の認証リダイレクトテストが通る
- [ ] AC-11-09: `npm run test -- --run` で全テストが PASSED になる

## 依存関係

- 前提タスク: Task-09（テスト基盤構築）
- 並行実行: Task-10（バックエンド単体テスト）と並行可能

## 実装メモ

- テストファイル配置: コンポーネントと同階層に `__tests__/` または `.test.tsx`
- フックテスト: `@testing-library/react` の `renderHook` を使用
- Recharts コンポーネント: `ResponsiveContainer` は jsdom で高さ 0 になるため適宜モック
- React Router: `MemoryRouter` でラップしてテスト
