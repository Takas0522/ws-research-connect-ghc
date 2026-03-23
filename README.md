# SaaS 管理アプリケーション

SaaS 製品の契約・請求・利用実績・トライアルを一元管理する Web アプリケーション。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| **Backend** | ASP.NET Core 10 Minimal API, EF Core 10, Npgsql |
| **Frontend** | React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4, recharts |
| **Database** | PostgreSQL 17 |
| **インフラ** | DevContainer (Docker Compose) |

## 主要機能

- 📦 **製品・課金プラン管理** — SaaS 製品とプラン（定額/従量/ハイブリッド）の CRUD
- 👥 **顧客管理** — 顧客情報の CRUD、契約・利用状況の一覧
- 📋 **契約管理** — 新規契約・プラン変更・解約・変更履歴
- 📊 **利用実績・請求** — 月次利用量の登録と請求額の自動計算
- 🧪 **トライアル管理** — トライアル開始・本契約転換・期限管理
- 📈 **ダッシュボード** — 売上推移グラフ・製品別比率・顧客 KPI・トライアル KPI

## クイックスタート

### 前提条件

- [DevContainer](https://containers.dev/) 対応の環境（VS Code + Dev Containers 拡張、GitHub Codespaces 等）

### 1. DevContainer の起動

VS Code でリポジトリを開き、**「Reopen in Container」** を実行します。
DevContainer が起動すると、以下が自動的にセットアップされます:

- .NET 10 SDK
- Node.js (LTS)
- PostgreSQL 17（`localhost:5432`）

### 2. データベースの初期化

DevContainer の初回起動時に `src/database/init/` の SQL が自動実行されます。
手動で再初期化する場合:

```bash
# スキーマの再作成
psql -h localhost -U postgres -d appdb -f src/database/init/001_init.sql

# シードデータの投入
psql -h localhost -U postgres -d appdb -f src/database/init/002_seed.sql
```

### 3. バックエンドの起動

```bash
cd src/backend
dotnet run
```

バックエンドはコンテナ内で `0.0.0.0:5010` にバインドされます。
ホストからは `http://localhost:5010` にアクセスしてください。

### 4. フロントエンドの起動

```bash
cd src/frontend
npm install   # 初回のみ
npm run dev
```

フロントエンドはコンテナ内で `0.0.0.0:5173` にバインドされます。
ホストからは `http://localhost:5173` にアクセスしてください。

> DevContainer / Codespaces ではホストからアクセスするために `0.0.0.0` バインドが必要です。
> フロントエンドの `/api` リクエストは Vite のプロキシ経由でバックエンド（`localhost:5010`）に転送されます。
> `5173` が使用中の場合、Vite は自動で別ポートへ切り替えずエラー終了します。公開済みポートとズレないよう、競合プロセスを停止してから再起動してください。

## 接続情報

### PostgreSQL

| 項目 | 値 |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `appdb` |
| User | `postgres` |
| Password | `postgres` |

### アプリケーション URL

| サービス | URL |
|---|---|
| フロントエンド | http://localhost:5173 |
| バックエンド API | http://localhost:5010 |
| OpenAPI (Swagger) | http://localhost:5010/openapi/v1.json |
| ヘルスチェック | http://localhost:5010/healthz |

## API エンドポイント一覧

| メソッド | パス | 説明 |
|---|---|---|
| `GET` | `/api/products` | 製品一覧 |
| `GET` | `/api/products/{id}` | 製品詳細（プラン含む） |
| `POST` | `/api/products` | 製品登録 |
| `PUT` | `/api/products/{id}` | 製品更新 |
| `POST` | `/api/products/{productId}/plans` | プラン追加 |
| `PUT` | `/api/plans/{id}` | プラン更新 |
| `GET` | `/api/customers` | 顧客一覧 |
| `GET` | `/api/customers/{id}` | 顧客詳細（契約・利用実績含む） |
| `POST` | `/api/customers` | 顧客登録 |
| `PUT` | `/api/customers/{id}` | 顧客更新 |
| `GET` | `/api/contracts` | 契約一覧 |
| `GET` | `/api/contracts/{id}` | 契約詳細（変更履歴含む） |
| `POST` | `/api/contracts` | 新規契約 |
| `PUT` | `/api/contracts/{id}/change-plan` | プラン変更 |
| `PUT` | `/api/contracts/{id}/cancel` | 解約 |
| `GET` | `/api/usages` | 利用実績一覧 |
| `POST` | `/api/usages` | 利用実績登録（請求額自動計算） |
| `GET` | `/api/trials` | トライアル一覧 |
| `POST` | `/api/trials` | トライアル開始 |
| `PUT` | `/api/trials/{id}/convert` | 本契約転換 |
| `PUT` | `/api/trials/{id}/cancel` | トライアルキャンセル |
| `GET` | `/api/dashboard/revenue` | 売上集計（月別・製品別） |
| `GET` | `/api/dashboard/customers` | 顧客サマリ KPI |
| `GET` | `/api/dashboard/trials` | トライアル KPI |

## 開発コマンド

### バックエンド

```bash
cd src/backend

dotnet build          # ビルド
dotnet run            # 起動
dotnet test           # テスト実行

# ヘルスチェック
curl http://localhost:5010/healthz
```

### フロントエンド

```bash
cd src/frontend

npm run dev           # 開発サーバー起動
npm run build         # プロダクションビルド
npm run lint          # ESLint 実行
npm test              # Vitest 実行
npm run test:watch    # Vitest ウォッチモード
```

### データベース

```bash
# psql で接続
psql -h localhost -U postgres -d appdb

# テーブル一覧確認
psql -h localhost -U postgres -d appdb -c "\dt"

# データ件数確認
psql -h localhost -U postgres -d appdb -c "
  SELECT 'products' AS table_name, count(*) FROM products
  UNION ALL SELECT 'plans', count(*) FROM plans
  UNION ALL SELECT 'customers', count(*) FROM customers
  UNION ALL SELECT 'contracts', count(*) FROM contracts
  UNION ALL SELECT 'monthly_usages', count(*) FROM monthly_usages
  UNION ALL SELECT 'trials', count(*) FROM trials;
"
```

## プロジェクト構成

```
src/
├── backend/                  # ASP.NET Core バックエンド
│   ├── Data/                 #   DbContext
│   ├── Endpoints/            #   Minimal API エンドポイント
│   ├── Models/               #   エンティティモデル・Enum
│   ├── Services/             #   ビジネスロジック（BillingService）
│   └── Program.cs            #   エントリポイント
├── database/
│   └── init/                 # PostgreSQL 初期化 SQL
│       ├── 001_init.sql      #   スキーマ定義
│       └── 002_seed.sql      #   シードデータ
├── frontend/                 # React フロントエンド
│   └── src/
│       ├── components/       #   共通コンポーネント
│       ├── lib/              #   ユーティリティ・Hooks
│       ├── pages/            #   ページコンポーネント
│       ├── types/            #   TypeScript 型定義
│       └── App.tsx           #   ルーティング定義
└── e2e/                      # E2E テスト（Playwright）
docs/
└── specs/saas-management-app/ # 仕様書・作業プラン
```

## 認証

v1 では認証機能は未実装です。すべてのユーザーが全機能にアクセスできます。
