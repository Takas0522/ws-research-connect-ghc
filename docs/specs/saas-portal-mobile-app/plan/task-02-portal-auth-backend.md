# Task-02: Portal 認証基盤 Backend

## 概要

ポータルアプリ専用の認証基盤を FastAPI に追加する。
社内管理アプリ（`get_current_user`）とは完全に分離した認証フロー（`get_current_portal_user`）を構築し、
JWT ペイロードに `tenant_id` を含めてテナントスコープのデータアクセスを実現する。

## スコープ

### バックエンド

**スキーマ (`app/schemas/portal_auth.py`):**
- `PortalSignupRequest` — email, password, display_name, tenant_code
- `PortalLoginRequest` — email, password
- `PortalTokenResponse` — access_token, refresh_token, token_type
- `PortalUserResponse` — id, email, display_name, role, tenant_id, tenant_code

**サービス (`app/services/portal_auth_service.py`):**
- `signup()` — テナントコード検証、ユーザー作成（bcrypt ハッシュ）、JWT 発行
- `login()` — email/password 認証、JWT 発行（`tenant_id`, `tenant_code`, `role` をペイロードに含む）
- `refresh_token()` — リフレッシュトークン検証、新アクセストークン発行
- `get_me()` — JWT からユーザー情報を取得

**認証依存 (`app/dependencies/portal_auth.py`):**
- `PortalUser` — Pydantic モデル（id, tenant_id, tenant_code, role, email）
- `get_current_portal_user()` — ポータル専用 JWT デコード → `portal_users` コレクション検索
- `require_portal_admin()` — テナント管理者のみ許可

**ルーター (`app/routers/portal_auth.py`):**

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/portal/auth/signup` | ユーザー登録 | 不要 |
| POST | `/api/portal/auth/login` | ログイン（JWT 発行） | 不要 |
| POST | `/api/portal/auth/refresh` | トークンリフレッシュ | リフレッシュトークン |
| GET | `/api/portal/auth/me` | ログインユーザー情報 | 必要 |

**ルーター登録 (`main.py`):**
- `portal_auth_router` を `app.include_router()` で追加

### データモデル

- `portal_tenants` — テナントコード検証（signup 時）
- `portal_users` — ユーザー CRUD、認証

## Acceptance Criteria

- [ ] AC-02-01: テナントコード `TENANT_ALPHA` で `admin@test.example.com` をサインアップすると、`portal_users` にユーザーが作成され、JWT アクセストークンとリフレッシュトークンが返される
- [ ] AC-02-02: 存在しないテナントコードでサインアップすると、400 エラー「テナントが見つかりません」が返される
- [ ] AC-02-03: 登録済みメールアドレスでサインアップすると、409 エラー「このメールアドレスは既に登録されています」が返される
- [ ] AC-02-04: 正しい email / password でログインすると、JWT ペイロードに `sub`(user_id), `tenant_id`, `tenant_code`, `role` が含まれたアクセストークンが返される
- [ ] AC-02-05: 有効な JWT で `/api/portal/auth/me` を呼ぶと、ユーザー情報（id, email, display_name, role, tenant_id, tenant_code）が返される
- [ ] AC-02-06: 期限切れの JWT で API を呼ぶと 401 エラーが返り、リフレッシュトークンで `/api/portal/auth/refresh` を呼ぶと新しいアクセストークンが発行される
- [ ] AC-02-07: `/api/portal/auth/me` のレスポンスに tenant_name と plan_tier が含まれる（テナント情報の結合取得）

## 依存関係

- 前提タスク: Task-01（portal_tenants, portal_users コレクション + シードデータ）
- 並行実行: 不可（後続タスクの前提）

## 実装メモ

- 既存の `app/core/security.py` の `create_access_token()`, `verify_password()`, `get_password_hash()` を再利用する
- JWT ペイロードに `tenant_id`, `tenant_code`, `role` を追加する（既存の管理アプリ JWT とは異なるペイロード構造）
- OAuth2 スキームは `OAuth2PasswordBearer(tokenUrl="/api/portal/auth/login")` でポータル専用のものを定義する
- リフレッシュトークンは `exp` を 7 日間に設定する
- パスワードは `app/core/security.py` の `get_password_hash()` で bcrypt ハッシュする
- signup 時のデフォルトロールは `member`。最初のユーザーまたはシードデータで `admin` を設定する
