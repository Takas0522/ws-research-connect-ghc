---
description: 'SaaS ポータルアプリ向け FastAPI バックエンド拡張の開発規約。テナントスコープ認可、portal_* コレクション、/api/portal/ プレフィックス'
applyTo: 'src/backend/app/**/portal_*.py'
---

# ポータル Backend 開発規約

## 概要

SaaS ポータルアプリ（スマートフォン向け）のバックエンド API を、既存の FastAPI + Motor 構成に追加する。
社内管理アプリ（saas-management-app）とは**ユーザー DB を完全に分離**し、ポータル専用の認証基盤を構築する。

## 仕様ドキュメント参照

| ドキュメント | パス |
|------------|------|
| データモデル | `docs/specs/saas-portal-mobile-app/system/03-data-model.md` |
| 認証・テナント設計 | `docs/specs/saas-portal-mobile-app/system/04-auth-design.md` |

## 既存アプリとの違い

| 項目 | 管理アプリ (saas-management-app) | ポータルアプリ (saas-portal-mobile-app) |
|------|-------------------------------|--------------------------------------|
| API プレフィックス | `/api/<resource>` | `/api/portal/<resource>` |
| コレクション名 | `products`, `customers` 等 | `portal_tenants`, `portal_users` 等 |
| ユーザーロール | `admin`, `sales_rep` | `admin`, `member` |
| 認証依存 | `get_current_user` | `get_current_portal_user` |
| データスコープ | ロールベース（全データ or 担当顧客） | テナントスコープ（自テナントのみ） |
| JWT ペイロード | `sub` (email) | `sub` (user_id), `tenant_id`, `tenant_code`, `role` |

## プロジェクト構造

ポータル用ファイルは `portal_` プレフィックスで命名し、既存ファイルと区別する。

```
src/backend/app/
├── schemas/
│   ├── portal_auth.py           # サインアップ/ログイン スキーマ
│   ├── portal_dashboard.py      # ダッシュボード レスポンス
│   ├── portal_subscription.py   # 契約サービス スキーマ
│   └── portal_usage.py          # 月次利用 スキーマ
├── services/
│   ├── portal_auth_service.py   # 認証ビジネスロジック
│   ├── portal_dashboard_service.py
│   ├── portal_subscription_service.py
│   └── portal_usage_service.py
├── routers/
│   ├── portal_auth.py           # /api/portal/auth/*
│   ├── portal_dashboard.py      # /api/portal/dashboard/*
│   └── portal_services.py       # /api/portal/services/*
└── dependencies/
    └── portal_auth.py           # テナントスコープ認証
```

## テナントスコープ認証

### 認証依存関数

```python
# app/dependencies/portal_auth.py
from pydantic import BaseModel

class PortalUser(BaseModel):
    """JWT から復元されたポータルユーザー。"""
    id: str
    tenant_id: str
    tenant_code: str
    role: str  # "admin" | "member"
    email: str

async def get_current_portal_user(
    token: str = Depends(oauth2_portal_scheme),
) -> PortalUser:
    """ポータル専用 JWT からユーザーを取得する。"""
    payload = decode_token(token)
    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    if not user_id or not tenant_id:
        raise HTTPException(status_code=401, detail="認証情報が無効です")
    # portal_users から検索
    db = get_database()
    user = await db["portal_users"].find_one({"_id": ObjectId(user_id), "is_active": True})
    if user is None:
        raise HTTPException(status_code=401, detail="ユーザーが見つかりません")
    return PortalUser(
        id=str(user["_id"]),
        tenant_id=str(user["tenant_id"]),
        tenant_code=payload.get("tenant_code", ""),
        role=user["role"],
        email=user["email"],
    )

def require_portal_admin(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> PortalUser:
    """テナント管理者のみ許可する。"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="テナント管理者権限が必要です")
    return current_user
```

### テナントスコープ適用パターン

すべてのデータアクセスで `current_user.tenant_id` によるフィルタリングを必須とする。

```python
@router.get("/api/portal/dashboard/summary")
async def get_dashboard_summary(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> DashboardSummaryResponse:
    db = get_database()
    # ✅ テナントスコープで制限
    metrics = await db["portal_usage_metrics"].find(
        {"tenant_id": ObjectId(current_user.tenant_id)}
    ).to_list(length=1000)
    return build_summary(metrics)
```

## JWT ペイロード設計

```python
def create_portal_access_token(user: dict, tenant: dict) -> str:
    """ポータル専用アクセストークンを生成する。"""
    data = {
        "sub": str(user["_id"]),
        "tenant_id": str(user["tenant_id"]),
        "tenant_code": tenant["tenant_code"],
        "role": user["role"],
    }
    return create_access_token(data)
```

## API エンドポイント設計

### 認証 API (`/api/portal/auth/`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/api/portal/auth/signup` | ユーザー登録 | 不要 |
| POST | `/api/portal/auth/login` | ログイン (JWT 発行) | 不要 |
| POST | `/api/portal/auth/refresh` | トークンリフレッシュ | リフレッシュトークン |
| GET | `/api/portal/auth/me` | ログインユーザー情報 | 必要 |

### ダッシュボード API (`/api/portal/dashboard/`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/portal/dashboard/summary` | テナント利用状況サマリー | 必要 |
| GET | `/api/portal/dashboard/trends` | 月次利用推移 | 必要 |
| GET | `/api/portal/dashboard/usage-by-purpose` | 利用目的別集計 | 必要 |

### サービス API (`/api/portal/services/`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/portal/services` | 契約サービス一覧 | 必要 |
| GET | `/api/portal/services/{service_code}/usage` | サービス別利用詳細 | 必要 |
| POST | `/api/portal/services/{service_code}/launch` | アプリ起動 (Mock) | 必要 |

## Router 登録

```python
# main.py に追加
from app.routers.portal_auth import router as portal_auth_router
from app.routers.portal_dashboard import router as portal_dashboard_router
from app.routers.portal_services import router as portal_services_router

app.include_router(portal_auth_router)
app.include_router(portal_dashboard_router)
app.include_router(portal_services_router)
```

## Validation

- lint / format: `cd src/backend && uv run ruff check . && uv run ruff format --check .`
- 型チェック: `cd src/backend && uv run pyright`
- テスト: `cd src/backend && uv run pytest`
- サーバー起動: `cd src/backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
