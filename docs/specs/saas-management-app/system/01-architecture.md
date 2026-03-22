# アーキテクチャ概要・技術スタック

## システム構成図

```
┌──────────────────────────────────────────────────────────────┐
│                         ブラウザ                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript 5.9 + Tailwind CSS v4           │  │
│  │  Vite 8 (dev server :5173)                             │  │
│  └────────────────────┬───────────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTP (REST API)
                        │ /api/*
┌───────────────────────┼──────────────────────────────────────┐
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ASP.NET Core 10 (Minimal API)                         │  │
│  │  :5010                                                 │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │  │
│  │  │ Products │  │Customers │  │ Contracts/Usage/Trial│ │  │
│  │  │ API      │  │ API      │  │ API                  │ │  │
│  │  └──────────┘  └──────────┘  └──────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  EF Core 10 (Npgsql)                             │  │  │
│  │  └──────────────────────┬───────────────────────────┘  │  │
│  └─────────────────────────┼──────────────────────────────┘  │
│                 Backend    │                                  │
└────────────────────────────┼─────────────────────────────────┘
                             │ TCP :5432
┌────────────────────────────┼─────────────────────────────────┐
│                            ▼                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Docker Compose)                           │  │
│  │  Database: appdb                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                 Database                                      │
└──────────────────────────────────────────────────────────────┘
```

## 技術スタック

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| .NET | 10.0 | ランタイム |
| ASP.NET Core | 10.0 | Web フレームワーク（Minimal API） |
| Entity Framework Core | 10.0.5 | ORM |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.0.1 | PostgreSQL プロバイダ |
| Microsoft.AspNetCore.OpenApi | 10.0.5 | OpenAPI / Swagger |

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 19.2.4 | UI ライブラリ |
| TypeScript | 5.9.3 | 型安全な JavaScript |
| Vite | 8.0.1 | ビルドツール・Dev server |
| Tailwind CSS | 4.2.2 | ユーティリティファースト CSS |
| Vitest | 4.1.0 | ユニットテスト |

### インフラ・データベース

| 技術 | 用途 |
|------|------|
| PostgreSQL | リレーショナルデータベース |
| Docker Compose | ローカル開発環境のDB起動 |

### テスト

| 技術 | 用途 |
|------|------|
| xUnit | バックエンドユニットテスト |
| Vitest + Testing Library | フロントエンドユニットテスト |
| Playwright | E2E テスト |

## アーキテクチャ方針

### バックエンド

- **Minimal API** を使用し、コントローラーは使用しない
- ファイルベースのエンドポイントグルーピング（`MapGroup` で機能別にグループ化）
- EF Core を直接使用（リポジトリパターンは v1 では不要）
- ビジネスロジック（課金計算等）はサービスクラスに切り出す

### フロントエンド

- **SPA（Single Page Application）** 構成
- React 19 の標準的な `useState` / `useEffect` でのデータ取得
- ダッシュボードのグラフ描画にはチャートライブラリを追加（後述）
- ページルーティングには React Router を使用

### データベース

- UUID を主キーとして使用（`uuid-ossp` 拡張が導入済み）
- タイムスタンプは全て `TIMESTAMPTZ`（タイムゾーン付き）
- データは論理削除方式（ステータスカラムで管理）
- 初期スキーマは `src/database/init/` 配下の SQL で管理

## ディレクトリ構成（追加・変更対象）

```
src/
├── backend/
│   ├── Program.cs                  # エンドポイント登録
│   ├── Data/
│   │   └── AppDbContext.cs         # DbSet 追加
│   ├── Models/                     # エンティティモデル追加
│   │   ├── Product.cs
│   │   ├── Plan.cs
│   │   ├── Customer.cs
│   │   ├── Contract.cs
│   │   ├── ContractHistory.cs
│   │   ├── MonthlyUsage.cs
│   │   └── Trial.cs
│   ├── Services/                   # ビジネスロジック
│   │   └── BillingService.cs
│   └── Endpoints/                  # API エンドポイント定義
│       ├── ProductEndpoints.cs
│       ├── CustomerEndpoints.cs
│       ├── ContractEndpoints.cs
│       ├── UsageEndpoints.cs
│       ├── TrialEndpoints.cs
│       └── DashboardEndpoints.cs
├── frontend/
│   └── src/
│       ├── pages/                  # ページコンポーネント
│       │   ├── ProductsPage.tsx
│       │   ├── CustomersPage.tsx
│       │   ├── ContractsPage.tsx
│       │   ├── UsagePage.tsx
│       │   ├── TrialsPage.tsx
│       │   └── DashboardPage.tsx
│       ├── components/             # 共通コンポーネント
│       └── types/                  # API レスポンス型定義
│           └── api.ts
└── database/
    └── init/
        └── 001_init.sql            # スキーマ定義を更新
```

## 追加ライブラリ（予定）

### フロントエンド

| ライブラリ | 用途 |
|-----------|------|
| react-router-dom | ページルーティング |
| recharts | グラフ・チャート描画（ダッシュボード用） |

> ライブラリの選定は最小限に留め、必要に応じて追加する。
