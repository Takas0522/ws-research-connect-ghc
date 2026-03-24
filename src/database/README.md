# Database (PostgreSQL)

PostgreSQL データベース環境。Docker Compose で起動します。

## 起動

```bash
# DevContainer 内から（docker-compose は devcontainer.json で自動起動）
# 手動起動する場合:
docker compose -f src/database/docker-compose.yml up -d
```

## 接続情報

| 項目       | 値         |
|-----------|-----------|
| Host      | localhost |
| Port      | 5432      |
| Database  | appdb     |
| Username  | postgres  |
| Password  | postgres  |

## 初期化

`init/` ディレクトリ内の SQL ファイルが PostgreSQL 初回起動時に自動実行されます。
