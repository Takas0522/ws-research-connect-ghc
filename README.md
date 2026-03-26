# SaaS 管理アプリ

営業部門が担当者ごとに Excel で管理している顧客・SaaS 契約・従量課金データを Web アプリケーションに一元化し、自動集計・可視化を実現するプロジェクト。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS + Recharts + React Router v7 |
| Backend | Python 3.12 + FastAPI + Pydantic v2 + Motor (MongoDB 非同期) |
| Database | MongoDB 7 |
| Auth | JWT (python-jose + passlib/bcrypt) |

## 主な機能

- **ダッシュボード** — 契約・課金データの集計・グラフ可視化
- **マスタ管理** — 製品・プラン・指標定義・顧客の CRUD
- **契約管理** — SaaS 契約の登録・更新・履歴管理
- **従量データ取込** — 月次 CSV インポートと取込監査

## ポートマッピング

| ポート | サービス |
|-------|---------|
| 5173 | Frontend (Vite dev server) |
| 8000 | Backend (FastAPI) |
| 27017 | MongoDB |

## 起動方法

> **前提:** DevContainer を起動していること。MongoDB は Docker Compose で自動起動する。

### 1. バックエンド

```bash
cd src/backend
uv run fastapi dev main.py --host 0.0.0.0
```

### 2. シードデータ投入（初回のみ・別ターミナルで）

```bash
cd src/backend
uv run python ../database/seed/seed_data.py
```

### 3. フロントエンド（別ターミナルで）

```bash
cd src/frontend
npm install
npm run dev -- --host 0.0.0.0
```

ブラウザで `http://localhost:5173` にアクセス。

## 初期ログイン情報

| 項目 | 値 |
|------|-----|
| メールアドレス | `admin@example.com` |
| パスワード | `admin123` |

> バックエンド初回起動時にユーザーが 0 件の場合、自動作成される。

## テスト

### バックエンド単体テスト (pytest)

```bash
cd src/backend
uv run pytest
```

### E2E テスト (Playwright)

```bash
cd src/e2e
npm install
npx playwright test
```

## ドキュメント

詳細仕様は `docs/specs/saas-management-app/` を参照。

| ドキュメント | 内容 |
|------------|------|
| [system/02-screen-design.md](docs/specs/saas-management-app/system/02-screen-design.md) | 画面構成・機能要件 |
| [system/03-data-model.md](docs/specs/saas-management-app/system/03-data-model.md) | データモデル |
| [system/04-auth-and-operations.md](docs/specs/saas-management-app/system/04-auth-and-operations.md) | 認証・権限設計 |
