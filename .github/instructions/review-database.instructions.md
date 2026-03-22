---
description: 'PostgreSQL スキーマ・SQL のコードレビュー観点'
applyTo: 'src/database/**'
excludeAgent: 'coding-agent'
---

# PostgreSQL コードレビューガイドライン

本プロジェクト（PostgreSQL 17 / Docker Compose / EF Core Npgsql）のデータベース関連コードをレビューする際の観点。

## レビュー観点一覧

| カテゴリ | 重要度 | 概要 |
|---------|-------|------|
| セキュリティ | 高 | 権限管理、RLS、インジェクション防止 |
| データ型 | 高 | PostgreSQL 固有の型の適切な使用 |
| スキーマ設計 | 高 | 制約、正規化、整合性 |
| インデックス | 中 | 検索パターンに合ったインデックス戦略 |
| クエリ品質 | 中 | パフォーマンス、可読性 |
| マイグレーション | 中 | 冪等性、ロールバック戦略 |
| 命名規則 | 低 | snake_case、プレフィックス規約 |

## セキュリティ

### 権限管理

- アプリケーションユーザーに `GRANT ALL` を付与していないか
- テーブル単位で必要最小限の権限（SELECT / INSERT / UPDATE / DELETE）のみ付与しているか
- `SUPERUSER` 権限をアプリケーションユーザーに使用していないか

```sql
-- ✅ GOOD: 必要最小限の権限
GRANT SELECT, INSERT, UPDATE ON weather_forecasts TO app_user;

-- ❌ BAD: 過剰な権限
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
```

### Row Level Security (RLS)

- マルチテナント・ユーザー固有データに RLS が設定されているか
- RLS ポリシーが適切に定義されているか

### ハードコード

- パスワードや機密情報が SQL ファイルに含まれていないか
- 初期化スクリプトの認証情報が環境変数経由か

## データ型

### 必須チェック

| 用途 | 正しい型 | 誤った型 |
|------|---------|---------|
| タイムスタンプ | `TIMESTAMPTZ` | `TIMESTAMP` |
| 主キー（UUID） | `UUID` + `uuid-ossp` | `SERIAL` / `BIGSERIAL`（要件による） |
| 限定値 | `ENUM` 型 | `VARCHAR` + CHECK 制約 |
| 金額 | `DECIMAL` / `NUMERIC` | `FLOAT` / `DOUBLE PRECISION` |
| 長文テキスト | `TEXT` | `VARCHAR(9999)` |
| 大文字小文字無視検索 | `CITEXT` | `TEXT` + `LOWER()` |
| 半構造化データ | `JSONB` | `JSON` / `TEXT` |

```sql
-- ✅ GOOD: TIMESTAMPTZ + UUID
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ❌ BAD: TIMESTAMP（タイムゾーン情報が失われる）
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## スキーマ設計

### 制約

- `NOT NULL` 制約が必要なカラムに設定されているか
- `CHECK` 制約でデータの妥当性を保証しているか
- 外部キー制約で参照整合性を維持しているか
- `ON DELETE` アクションが適切か（CASCADE / SET NULL / RESTRICT）
- UNIQUE 制約が必要な箇所に設定されているか

### デフォルト値

- `created_at` / `updated_at` にデフォルト値（`NOW()`）が設定されているか
- UUID 主キーに `uuid_generate_v4()` が設定されているか
- ビジネス的にデフォルト値を持つべきカラムに設定されているか

### 正規化

- 不必要な冗長データがないか（第3正規形を基本とする）
- 意図的な非正規化にはコメントで理由を記載しているか
- JSONB カラムを構造化すべきデータに使用していないか

## インデックス

### インデックス戦略

- WHERE 句で頻繁に使用されるカラムにインデックスがあるか
- 外部キーカラムにインデックスがあるか（JOIN パフォーマンス）
- JSONB カラムに GIN インデックスがあるか
- 配列カラムに GIN インデックスがあるか
- 検索パターンに合った複合インデックスが定義されているか
- 不要なインデックスがないか（書き込みコストの増加）

```sql
-- ✅ GOOD: 複合インデックス（検索パターンに合致）
CREATE INDEX idx_orders_user_status ON orders (user_id, status);

-- ✅ GOOD: JSONB GIN インデックス
CREATE INDEX idx_events_data ON events USING GIN (data);

-- ❌ BAD: 不要な単一カラムインデックス（すでに複合インデックスの先頭に含まれる）
CREATE INDEX idx_orders_user ON orders (user_id);
```

### JSONB クエリ

- 包含演算子（`@>`）を使用しているか（GIN インデックスを利用可能）
- `->>`演算子チェーンではないか（インデックスが利用されない）

```sql
-- ✅ GOOD: 包含演算子（GIN インデックス利用可能）
SELECT * FROM events WHERE data @> '{"type": "click"}';

-- ❌ BAD: 演算子チェーン（フルスキャン）
SELECT * FROM events WHERE data->>'type' = 'click';
```

## クエリ品質

### パフォーマンス

- `SELECT *` を使用していないか（必要なカラムのみ指定）
- サブクエリが CTE（`WITH` 句）で整理されているか
- `EXPLAIN ANALYZE` で実行計画を確認すべき複雑なクエリか
- ページネーションに `LIMIT` / `OFFSET` を適切に使用しているか
- 大量データの `OFFSET` にはカーソルベースのページネーションを検討しているか

### 可読性

- SQL キーワードが一貫して大文字か
- 複雑なクエリにコメントがあるか
- JOIN 条件が明示的か（暗黙的な CROSS JOIN がないか）

## マイグレーション

### 冪等性

- `CREATE TABLE IF NOT EXISTS` を使用しているか
- `CREATE EXTENSION IF NOT EXISTS` を使用しているか
- `CREATE INDEX IF NOT EXISTS` を使用しているか
- `DO $$ ... IF NOT EXISTS ... $$` パターンで条件付き実行しているか

### 安全性

- テーブル削除（`DROP TABLE`）に `IF EXISTS` が付いているか
- カラム追加に `NOT NULL` を付ける場合、デフォルト値を同時に設定しているか
- 大規模テーブルへのインデックス追加は `CONCURRENTLY` を使用しているか
- ロールバック戦略が考慮されているか

## 命名規則

- テーブル名・カラム名が `snake_case` か
- インデックス名が `idx_{table}_{column}` パターンか
- 外部キーカラムが `{referenced_table}_id` パターンか
- ENUM 型名が意味のある名前か
- テーブル名が複数形か

## レビューチェックリスト

- [ ] アプリケーションユーザーに過剰な権限を付与していないか
- [ ] パスワード・シークレットがハードコードされていないか
- [ ] `TIMESTAMPTZ` を使用しているか（`TIMESTAMP` ではない）
- [ ] UUID 主キーに `uuid-ossp` を使用しているか
- [ ] `NOT NULL` / `CHECK` / 外部キー制約が適切か
- [ ] JSONB クエリが包含演算子を使用しているか
- [ ] インデックス戦略が検索パターンに合っているか
- [ ] マイグレーションが冪等か
- [ ] 命名が `snake_case` 規約に従っているか
