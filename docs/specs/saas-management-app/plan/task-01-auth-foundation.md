# Task-01: 認証基盤・ログイン画面

## 概要

JWT 認証基盤を構築し、ログイン画面・保護ルート・共通レイアウトを実装する。
すべてのタスクの土台となるため、最優先で完了させる。

## スコープ

### バックエンド
- `app/core/config.py` — pydantic-settings による環境変数管理（MONGO_URI, SECRET_KEY, etc.）
- `app/core/database.py` — Motor クライアント・DB 接続（lifespan イベントで開閉）
- `app/core/security.py` — JWT トークン生成・検証、bcrypt パスワードハッシュ
- `app/models/common.py` — PyObjectId ヘルパー
- `app/schemas/auth.py` — LoginRequest, TokenResponse
- `app/schemas/user.py` — UserResponse
- `app/services/user_service.py` — ユーザー検索・認証
- `app/routers/auth.py` — `POST /api/auth/token`（OAuth2PasswordRequestForm）
- `app/dependencies/auth.py` — `get_current_user`, `get_current_admin_user`
- `main.py` 更新 — CORS 設定、ルーター登録、lifespan

### フロントエンド
- `pages/LoginPage.tsx` — ログインフォーム（email / password）
- `hooks/useAuth.ts` — 認証状態管理（トークン保持・ログイン・ログアウト）
- `components/Layout/Layout.tsx` — グローバルナビ付き共通レイアウト
- `components/Layout/ProtectedRoute.tsx` — 未認証時リダイレクト
- `api/auth.ts` — ログイン API クライアント
- `api/client.ts` — 共通 fetch ラッパー（Bearer トークン付与）
- `types/api.ts` — User 型定義
- `App.tsx` — React Router v7 によるルーティング定義

### データモデル
- `users` コレクション（email, display_name, role, password_hash, is_active）
- `users.email` ユニークインデックス

### データベース初期化
- `src/database/init/01-create-indexes.js` — 全コレクションのインデックス作成
- 初期管理者ユーザーのシードデータ投入（バックエンド起動時）

## Acceptance Criteria

- [ ] AC-01-01: 管理者が正しいメールアドレス・パスワードでログインすると、ダッシュボード画面（トップページ）に遷移する
- [ ] AC-01-02: 誤ったパスワードでログインすると、「メールアドレスまたはパスワードが正しくありません」とエラーメッセージが表示される
- [ ] AC-01-03: 未認証ユーザーが保護画面（/dashboard 等）に直接アクセスすると、ログイン画面にリダイレクトされる
- [ ] AC-01-04: ログイン後、グローバルナビに「ダッシュボード」「マスタ管理」「契約管理」「データ取込」の 4 メニューが表示され、画面を切り替えられる

## 依存関係
- 前提タスク: なし
- 並行実行: このタスクは他のすべてのタスクの前提となる

## 実装メモ
- JWT アクセストークンの有効期限は 60 分（仕様 04-auth-and-operations.md）
- トークンは sessionStorage に保存（localStorage は使用しない）
- パスワードは bcrypt でハッシュ化（passlib 使用）
- CORS は開発環境では `http://localhost:5173` を許可
- Vite の proxy 設定（`/api` → `http://localhost:8000`）は既に構成済み
- 初期管理者: admin@example.com / 適切なパスワード（.env で管理）
