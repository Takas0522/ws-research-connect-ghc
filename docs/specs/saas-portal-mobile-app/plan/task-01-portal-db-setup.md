# Task-01: Portal DB 初期化・シードデータ

## 概要

ポータルアプリ専用の MongoDB コレクション（`portal_*`）を作成し、インデックスを設定する。
PoC 検証用のシードデータ（テナント、ユーザー、契約、利用実績）を投入するスクリプトを用意する。

## スコープ

### バックエンド

- なし（DB 初期化スクリプトのみ）

### データベース

- `src/database/portal/init/` — コレクション作成 & インデックス設定スクリプト
- `src/database/portal/seed/` — PoC 用シードデータ投入スクリプト

### データモデル

| コレクション | 説明 |
|------------|------|
| `portal_tenants` | テナント（顧客企業）情報 |
| `portal_users` | テナント所属ユーザー |
| `portal_subscriptions` | テナント契約サービス |
| `portal_usage_metrics` | 月次利用実績 |

### シードデータ

テナント 1 社 + ユーザー 2 名 (admin/member) + 契約 3 サービス + 12 ヶ月分利用実績を用意する。

**テナント:**
- `TENANT_ALPHA` — アルファ株式会社 (enterprise プラン)

**ユーザー:**
- `admin@alpha.example.com` — テナント管理者 (admin)
- `member@alpha.example.com` — 一般ユーザー (member)

**契約サービス:**
- `CONNECT_CHAT` — ConnectChat (Enterprise プラン)
- `CONNECT_MEET` — ConnectMeet (Pro プラン)
- `CONNECT_STORE` — ConnectStore (Standard プラン)

**利用実績:**
- 各サービス × 12 ヶ月分 (2025-04 〜 2026-03) の `portal_usage_metrics`
- 利用率は 50〜120% で変動させる（超過ケース含む）

## Acceptance Criteria

- [ ] AC-01-01: MongoDB に `portal_tenants`, `portal_users`, `portal_subscriptions`, `portal_usage_metrics` の 4 コレクションが作成される
- [ ] AC-01-02: `portal_tenants.tenant_code` に unique インデックス、`portal_users.email` に unique インデックスが設定されている
- [ ] AC-01-03: シードスクリプト実行後、テナント 1 社・ユーザー 2 名・契約 3 件・利用実績 36 件（3 サービス × 12 ヶ月）が投入されている
- [ ] AC-01-04: シードデータのパスワードは bcrypt でハッシュ化されている

## 依存関係

- 前提タスク: なし
- 並行実行: 他タスクと並行可能（最初に実行すべき）

## 実装メモ

- コレクション設計は `docs/specs/saas-portal-mobile-app/system/03-data-model.md` に準拠する
- インデックス設計は `.github/instructions/mongodb-portal.instructions.md` に準拠する
- 既存の `src/database/init/01-create-indexes.js` と同様の形式で `portal` 用を作成する
- シードデータのパスワードは bcrypt ハッシュ済みで格納する（平文をスクリプトに含めない、または実行時にハッシュする）
- `_id` は `ObjectId` を使用する。参照フィールド（`tenant_id` 等）も `ObjectId` 型で格納する
