---
id: task-001
title: "データベーススキーマ作成とシードデータ投入"
execution: local
depends_on: []
parallel: false
---

# データベーススキーマ作成とシードデータ投入

## 概要

SaaS管理アプリのすべてのテーブル、ENUM型、インデックス、制約、トリガーを定義し、開発・テスト用のシードデータを投入する。

## 作業内容

- `src/database/init/001_init.sql` を更新し、既存の `samples` テーブルを削除して以下を定義:
  - ENUM型: `product_status`, `contract_type`, `contract_status`, `contract_change_type`, `trial_restriction`, `trial_status`
  - テーブル: `products`, `plans`, `customers`, `contracts`, `contract_histories`, `monthly_usages`, `trials`
  - 各テーブルの制約（UNIQUE, CHECK, 部分ユニークインデックス）
  - `updated_at` 自動更新トリガー
- `src/database/init/002_seed.sql` にシードデータを作成:
  - 製品 7 件（仕様書記載の SaaS 製品）
  - 課金プラン 14 件（仕様書記載の全プラン）
  - 顧客 7 社
  - 契約 15 件
  - 月次利用実績 45 件（1〜3月分）
- スキーマ定義は `docs/specs/saas-management-app/system/02-database-schema.md` に準拠
- すべての DDL は冪等（`IF NOT EXISTS` / `CREATE OR REPLACE`）

## Acceptance Criteria

- [ ] `docker compose down -v && docker compose up -d` でDBが正常に起動すること
- [ ] `psql` で全テーブルの存在を確認できること
- [ ] 全 ENUM 型が定義されていること
- [ ] 部分ユニークインデックス（アクティブ契約の一意性、アクティブトライアルの一意性）が存在すること
- [ ] `updated_at` トリガーが全対象テーブルに適用されていること
- [ ] シードデータが正常に投入され、製品7件・プラン14件・顧客7社・契約15件・利用実績45件が確認できること
- [ ] 既存の `samples` テーブル関連コードが削除されていること

## テスト

### ユニットテスト
- なし（DDL のため）

### E2E テスト
- なし
