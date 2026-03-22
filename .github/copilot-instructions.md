# Copilot Instructions

このリポジトリでの開発における一般的なガイドラインと注意事項。

## DevContainer 構成

特に指定がない限りDevContainer内からチャットは実行される。
DevContainer は **Docker Compose** で構成されている。

| サービス | イメージ | 説明 |
|---|---|---|
| `app` | `mcr.microsoft.com/devcontainers/base:ubuntu-24.04` | 開発環境（.NET 10, Node.js LTS, GitHub CLI, Docker-in-Docker） |
| `db` | `postgres:17` | PostgreSQL データベース |

- `app` と `db` は `network_mode: service:db` でネットワーク名前空間を共有しているため、アプリからは **`localhost:5432`** で PostgreSQL に接続できる
- DB の初期化 SQL は `src/database/init/` に配置し、PostgreSQL 初回起動時に自動実行される
- MSAL トークンキャッシュは `m365-comm-cache` named volume で永続化されている
- Pythonはインストールされていないためコマンド実行が必要な場合は `dotnet-script` または Node.js のスクリプトを使用すること

### 接続情報

| 項目 | 値 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `appdb` |
| User | `postgres` |
| Password | `postgres` |

## テクノロジースタック

- **Backend**: ASP.NET Core 10 Minimal API, EF Core, Npgsql
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL 17
- **Testing**: xUnit (backend), Vitest (frontend), Playwright (E2E)

# Excluded Directories

以下のディレクトリ配下のファイルは参照・変更しないでください。

- `workshop-docs/`
- `tools/`

これらのディレクトリにはワークショップ資料やツール類が含まれており、通常の開発作業の対象外です。
コード生成・レビュー・リファクタリング等のタスクにおいて、これらのディレクトリの内容をコンテキストとして使用しないでください。
