---
description: 'PostgreSQL データベース設計・SQL のベストプラクティス'
applyTo: 'src/database/**'
---

# PostgreSQL データベースガイドライン

本プロジェクトは PostgreSQL 17 を Docker Compose で実行する。

## スキーマ設計

| データ型 | 用途 | 注意点 |
|---|---|---|
| `UUID` | 主キー | `uuid_generate_v4()` で自動生成 |
| `TIMESTAMPTZ` | タイムスタンプ | `TIMESTAMP`（TZ なし）は使わない |
| `TEXT` | 文字列 | 固定長が不要な場合は `VARCHAR` より `TEXT` |
| `CITEXT` | 大小区別なしテキスト | メールアドレス等に有用 |
| `ENUM` | 限定値の集合 | ステータス等 |
| `JSONB` | 半構造化データ | GIN インデックスと併用 |

- 再利用可能な制約は `DOMAIN` で定義する
- `CHECK` 制約でデータの妥当性を保証する

### Good Example - テーブル定義

```sql
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL,
    temperature_c INTEGER NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Bad Example - タイムゾーンなし TIMESTAMP

```sql
-- TIMESTAMP はタイムゾーン情報が失われる
CREATE TABLE weather_forecasts (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
```

## 命名規則

- テーブル名: スネークケースの複数形（例: `users`, `weather_forecasts`）
- カラム名: スネークケース（例: `created_at`, `user_id`）
- インデックス名: `idx_{table}_{column}` パターン
- 制約名: `{table}_{column}_{type}` パターン（例: `users_email_unique`）

## マイグレーション

- 初期化 SQL は `init/` ディレクトリに連番プレフィックスで配置する（例: `001_init.sql`, `002_add_users.sql`）
- Docker の `docker-entrypoint-initdb.d` マウント経由で初回起動時に自動実行される
- 各ファイルは冪等性を確保する（`IF NOT EXISTS` / `IF EXISTS` を使用）
- `CREATE EXTENSION IF NOT EXISTS` でエクステンションを安全に追加する

### Good Example - 冪等なマイグレーション

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);
```

### Bad Example - 冪等でないマイグレーション

```sql
-- IF NOT EXISTS がないため2回目以降でエラーになる
CREATE EXTENSION "uuid-ossp";
CREATE TABLE weather_forecasts (id UUID PRIMARY KEY);
```

## インデックス戦略

- JSONB カラムには GIN インデックスを使用する
- 配列カラムには GIN インデックスを使用する
- JSONB クエリには包含演算子 (`@>`, `?`) を使用する
- 複合インデックスはクエリパターンに合わせて設計する

## JSONB 活用

```sql
-- ✅ インデックスが効くクエリ
CREATE INDEX idx_table_data ON table_name USING gin(data);
SELECT * FROM table_name WHERE data @> '{"status": "active"}';

-- ❌ インデックスが効かないクエリ
SELECT * FROM table_name WHERE data->>'status' = 'active';
```

## セキュリティ

- アプリケーションユーザーには必要最小限の権限のみ付与する
- `GRANT ALL PRIVILEGES` は避け、`SELECT`, `INSERT`, `UPDATE`, `DELETE` を個別に付与する
- センシティブデータには Row Level Security (RLS) を検討する
- 接続文字列のパスワードは本番環境ではシークレット管理サービスで管理する

### Good Example - 最小権限の付与

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON weather_forecasts TO app_user;
```

### Bad Example - 全権限の付与

```sql
-- 過剰な権限付与はセキュリティリスク
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
```

## Docker Compose 構成（設定済み）

- イメージ: `postgres:17`
- コンテナ名: `appdb-postgres`
- ポート: `5432:5432`
- データ永続化: `pgdata` ボリューム
- ヘルスチェック: `pg_isready -U postgres`
- 初期化: `./init` → `/docker-entrypoint-initdb.d` マウント

## バリデーション

- DB 起動: `cd src/database && docker compose up -d`
- DB 停止: `cd src/database && docker compose down`
- 接続確認: `docker exec appdb-postgres pg_isready -U postgres`
- SQL 実行: `docker exec -it appdb-postgres psql -U postgres -d appdb`

## 参考リソース

- [PostgreSQL 17 ドキュメント](https://www.postgresql.org/docs/17/)
- [Docker Postgres イメージ](https://hub.docker.com/_/postgres)
