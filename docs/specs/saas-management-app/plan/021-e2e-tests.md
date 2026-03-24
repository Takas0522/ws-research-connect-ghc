---
id: task-021
title: "E2E テスト（Playwright + Testcontainers）"
execution: local
depends_on: [task-020]
parallel: false
---

# E2E テスト（Playwright + Testcontainers）

## 概要

Playwright + Testcontainers で主要ユーザーフローの E2E テストを作成・実行する。Testcontainers で PostgreSQL を起動し、シードデータを投入した状態でテストを実行する。

## 作業内容

- `src/e2e/` の構成を整備:
  - `global-setup.ts` — Testcontainers で PostgreSQL 起動、スキーマ適用、シードデータ投入、スナップショット取得
  - `global-teardown.ts` — コンテナ停止
  - `fixtures/seed.sql` — E2E テスト用シードデータ
  - `playwright.config.ts` を Testcontainers 統合用に更新
- 以下のシナリオをカバーするテストを作成:
  1. **製品マスタ登録とプラン追加**（シナリオ9）
     - 製品追加 → プラン追加 → 一覧で確認
  2. **新規顧客登録と契約作成**（シナリオ2）
     - 顧客追加 → 契約登録 → 一覧で確認
  3. **利用実績登録と請求額確認**（シナリオ1）
     - 利用実績登録 → 請求額プレビュー確認 → 一覧で確認
  4. **ダッシュボード表示**（シナリオ4）
     - KPI カード表示確認 → グラフ表示確認
  5. **トライアル開始と本契約転換**（シナリオ5, 6）
     - トライアル開始 → 一覧で確認 → 本契約転換 → 契約一覧で確認
- Page Object Model でロケーターをカプセル化
- `src/e2e/pages/` に各ページオブジェクトを作成

## Acceptance Criteria

- [ ] Testcontainers で PostgreSQL が起動し、スキーマとシードデータが投入されること
- [ ] 各テストの beforeEach でスナップショットからリストアされること
- [ ] 全5シナリオのテストが通ること
- [ ] Page Object Model でロケーターが管理されていること
- [ ] テストレポートが生成されること

## テスト

### E2E テスト
- `Products - register new product and add plan`
- `Contracts - register customer and create contract`
- `Usage - register monthly usage and verify billing`
- `Dashboard - displays KPI cards and charts`
- `Trials - start trial and convert to contract`
