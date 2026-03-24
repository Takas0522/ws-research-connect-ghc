---
name: postgresql-code-review
description: >-
  PostgreSQL のスキーマ設計・SQL クエリをレビューするスキル。
  PostgreSQL 固有のベストプラクティス、アンチパターン、パフォーマンス最適化を確認する。
  Use when asked to review SQL files, database schema, migration scripts,
  or PostgreSQL-related code in the project.
---

# PostgreSQL コードレビュースキル

PostgreSQL 固有のベストプラクティスに基づいて SQL コードをレビューする。

## レビュー対象

- `src/database/init/` 配下の SQL ファイル
- EF Core のマイグレーションで生成された SQL
- バックエンドコード内の生 SQL クエリ

## レビュー観点

### データ型

- `TIMESTAMPTZ` を使用しているか（`TIMESTAMP` ではない）
- UUID 主キーに `uuid-ossp` 拡張を使用しているか
- 限定値には `ENUM` 型を使用しているか
- 文字列には適切に `TEXT` / `VARCHAR` / `CITEXT` を使い分けているか
- 金額には `DECIMAL` / `NUMERIC` を使用しているか

### インデックス

- JSONB カラムに GIN インデックスがあるか
- 配列カラムに GIN インデックスがあるか
- 検索パターンに合った複合インデックスが定義されているか
- 不要なインデックスがないか

### クエリパターン

```sql
-- ✅ GOOD: JSONB 包含演算子（インデックス利用可能）
SELECT * FROM orders WHERE data @> '{"status": "shipped"}';

-- ❌ BAD: 演算子チェーン（インデックス利用不可）
SELECT * FROM orders WHERE data->>'status' = 'shipped';

-- ✅ GOOD: 配列演算子（インデックス利用可能）
SELECT * FROM products WHERE categories @> ARRAY['electronics'];

-- ❌ BAD: ANY 演算子（インデックス利用不可）
SELECT * FROM products WHERE 'electronics' = ANY(categories);
```

### セキュリティ

- アプリケーションユーザーに過剰な権限が付与されていないか
- Row Level Security (RLS) が必要な箇所に設定されているか
- パスワードや機密情報が SQL ファイルにハードコードされていないか

### スキーマ設計

- `NOT NULL` 制約が適切に設定されているか
- `CHECK` 制約でデータの妥当性を保証しているか
- 外部キー制約で参照整合性を維持しているか
- `ON DELETE` アクションが適切に設定されているか

### マイグレーション

- `CREATE TABLE IF NOT EXISTS` で冪等性を確保しているか
- `CREATE EXTENSION IF NOT EXISTS` を使用しているか
- ロールバック戦略が考慮されているか

## レビュー結果のフォーマット

| カテゴリ | 重要度 | 指摘内容 | 推奨修正 |
|---------|--------|---------|---------|
| データ型 | 高/中/低 | 具体的な問題点 | 修正案 |

## チェックリスト

- [ ] PostgreSQL 固有のデータ型を適切に使用しているか
- [ ] インデックス戦略が適切か
- [ ] JSONB クエリが包含演算子を使用しているか
- [ ] セキュリティ設定が適切か
- [ ] 制約が十分に定義されているか
- [ ] マイグレーションが冪等か
