# Copilot Instructions

このリポジトリでの開発における共通ガイドライン。
言語・フレームワーク別の詳細規約は `.github/instructions/` 配下のファイルを参照。
アプリケーション開発はDevContainerの環境上で実行されることを前提としている。DBの接続などはDevContainer内から行われる。

## プロジェクト概要

**SaaS 管理アプリ** — 営業部門が担当者ごとに Excel で管理している顧客・SaaS 契約・従量課金データを Web アプリに一元化するプロジェクト。

| レイヤー | 技術スタック |
|---------|------------|
| Frontend | React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS 3 + Recharts 2 + React Router v7 |
| Backend | Python 3.12 + FastAPI + Pydantic v2 + Motor (MongoDB 非同期) |
| Database | MongoDB 7 |
| Auth | JWT (python-jose + passlib/bcrypt) |
| E2E Tests | Playwright + TypeScript |
| Package Manager | uv (Python), npm (Node.js) |

## 仕様ドキュメント

機能仕様・データモデル・画面設計は `docs/specs/saas-management-app/` を参照する。
実装前に必ず対応する仕様書を確認すること。

| ドキュメント | パス |
|------------|------|
| 画面構成・機能要件 | `docs/specs/saas-management-app/system/02-screen-design.md` |
| データモデル | `docs/specs/saas-management-app/system/03-data-model.md` |
| 認証・権限設計 | `docs/specs/saas-management-app/system/04-auth-and-operations.md` |

## DevContainer 構成

DevContainer は **Docker Compose** で構成されている。
特に指定がない限り DevContainer 内からチャットは実行される。

以下のディレクトリ配下のファイルは参照・変更しないこと:

- `workshop-docs/` — ワークショップ資料
- `tools/` — ツール類

## ポートマッピング

| ポート | サービス |
|-------|---------|
| 5173 | Frontend (Vite dev server) |
| 8000 | Backend (FastAPI) |
| 27017 | MongoDB |
| 9323 | Playwright HTML Report |

## セキュリティ規約

- シークレット (API キー、パスワード等) は環境変数 (`.env`) で管理し、ソースコードにハードコードしない
- パスワードは bcrypt でハッシュ化する。平文パスワードをログ出力しない
- JWT の `SECRET_KEY` は十分な長さ (256bit 以上) のランダム文字列にする
- ユーザー入力は Pydantic の `Field` 制約で必ずバリデーションする
- CORS は本番環境で許可オリジンを明示する
- 依存パッケージは定期的に `uv lock --upgrade` / `npm audit` で脆弱性チェックする

## Git 規約

### ブランチ命名

```
feature/<feature-name>   # 新機能
fix/<bug-description>    # バグ修正
chore/<task>             # 設定変更・依存更新など
```

### コミットメッセージ

Conventional Commits 形式を使用する:

```
feat: 製品マスタ CRUD エンドポイントを追加
fix: JWT トークン有効期限の検証を修正
chore: 依存パッケージを更新
docs: API ドキュメントを更新
test: ダッシュボード E2E テストを追加
```
