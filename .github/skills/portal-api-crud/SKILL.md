---
name: portal-api-crud
description: >-
  SaaS ポータルアプリ向け FastAPI + Pydantic v2 + Motor CRUD エンドポイントを生成するスキル。
  テナントスコープ認可付き APIRouter、ポータル専用コレクション (portal_*) に対応する。
  JWT ペイロードに tenant_id を含み、すべてのデータアクセスをテナント単位で制限する。
  Use when asked to create portal API endpoints, tenant-scoped CRUD,
  portal backend features, or portal authentication for the mobile app.
  Keywords: portal, tenant, portal API, portal endpoint, portal service, portal auth.
---

# ポータル API CRUD 生成スキル

SaaS ポータルアプリ向けの FastAPI CRUD エンドポイントを生成する。
テナントスコープ認可、ポータル専用コレクション (`portal_*`)、`/api/portal/` プレフィックスに対応する。

## このスキルを使うタイミング

- **ポータル向け API エンドポイント** を追加するとき
- **テナントスコープ付き CRUD** を実装するとき
- **ポータル認証** (サインアップ / ログイン / トークンリフレッシュ) を実装するとき
- **ダッシュボード集計 API** を実装するとき
- **サービス一覧 / 利用状況 API** を実装するとき

## 前提条件

- `src/backend/pyproject.toml` に fastapi, motor, pydantic, python-jose, passlib が含まれること
- バックエンドは `uv sync` でセットアップ済みであること
- MongoDB は `localhost:27017` で起動中であること (DevContainer で自動起動)
- 管理アプリの基盤モジュール (`app/core/`) が作成済みであること

## 仕様ドキュメント参照

- **データモデル**: `docs/specs/saas-portal-mobile-app/system/03-data-model.md`
- **認証・API 設計**: `docs/specs/saas-portal-mobile-app/system/04-auth-design.md`

## プロジェクト構造 (ポータル追加分)

```
src/backend/app/
├── schemas/
│   ├── portal_auth.py              # サインアップ / ログイン スキーマ
│   ├── portal_dashboard.py         # ダッシュボード レスポンス
│   ├── portal_subscription.py      # 契約サービス スキーマ
│   └── portal_usage.py             # 月次利用 スキーマ
├── services/
│   ├── portal_auth_service.py      # 認証ビジネスロジック
│   ├── portal_dashboard_service.py # ダッシュボード集計
│   ├── portal_subscription_service.py
│   └── portal_usage_service.py
├── routers/
│   ├── portal_auth.py              # /api/portal/auth/*
│   ├── portal_dashboard.py         # /api/portal/dashboard/*
│   └── portal_services.py          # /api/portal/services/*
└── dependencies/
    └── portal_auth.py              # テナントスコープ認証
```

## ワークフロー

### TODO
- [ ] Step 1: 仕様確認
- [ ] Step 2: テナントスコープ認証依存の作成
- [ ] Step 3: Pydantic スキーマの生成
- [ ] Step 4: Motor サービス層の生成
- [ ] Step 5: APIRouter エンドポイントの生成
- [ ] Step 6: `main.py` へのルーター登録
- [ ] Step 7: 動作確認

### Step 1: 仕様確認

実装前に以下を確認する:

- `docs/specs/saas-portal-mobile-app/system/03-data-model.md` のコレクション定義
- `docs/specs/saas-portal-mobile-app/system/04-auth-design.md` の API エンドポイント一覧

ポータルコレクション一覧:

| コレクション | 主な操作 | 必要ロール |
|------------|---------|---------|
| `portal_tenants` | R | 認証済み (自テナント) |
| `portal_users` | CRUD | admin (CUD) / 全員 (R-自分) |
| `portal_subscriptions` | R | 認証済み (自テナント) |
| `portal_usage_metrics` | R | 認証済み (自テナント) |
| `portal_feature_flags` | R | 認証済み (Phase 2) |
| `portal_tenant_features` | RU | admin (U) / 全員 (R) (Phase 2) |

### Step 2: テナントスコープ認証依存の作成

`app/dependencies/portal_auth.py` を作成する。

```python
# app/dependencies/portal_auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from bson import ObjectId
from pydantic import BaseModel
from ..core.database import get_database
from ..core.security import decode_token

oauth2_portal_scheme = OAuth2PasswordBearer(tokenUrl="/api/portal/auth/login")


class PortalUser(BaseModel):
    """JWT から復元されたポータルユーザー。"""
    id: str
    tenant_id: str
    tenant_code: str
    role: str
    email: str


async def get_current_portal_user(
    token: str = Depends(oauth2_portal_scheme),
) -> PortalUser:
    """ポータル JWT からテナントスコープ付きユーザーを取得する。"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        tenant_id: str | None = payload.get("tenant_id")
        if user_id is None or tenant_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await db["portal_users"].find_one(
        {"_id": ObjectId(user_id), "is_active": True}
    )
    if user is None:
        raise credentials_exception

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
    """テナント管理者権限を要求する。"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="テナント管理者権限が必要です",
        )
    return current_user
```

### Step 3: Pydantic スキーマの生成

#### 認証スキーマ

```python
# app/schemas/portal_auth.py
from pydantic import BaseModel, Field
from datetime import datetime


class PortalSignUpRequest(BaseModel):
    """ポータルユーザー登録リクエスト。"""
    email: str = Field(..., min_length=1, description="メールアドレス")
    password: str = Field(..., min_length=8, description="パスワード（8文字以上）")
    display_name: str = Field(..., min_length=1, max_length=100, description="表示名")
    tenant_code: str = Field(..., min_length=1, description="テナントコード")


class PortalLoginRequest(BaseModel):
    """ポータルログインリクエスト。"""
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class PortalTokenResponse(BaseModel):
    """JWT トークンレスポンス。"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PortalUserResponse(BaseModel):
    """ポータルユーザーレスポンス。"""
    id: str
    tenant_id: str
    email: str
    display_name: str
    role: str
    last_login_at: datetime | None = None
```

#### ダッシュボードスキーマ

```python
# app/schemas/portal_dashboard.py
from pydantic import BaseModel


class UsageMetricItem(BaseModel):
    """利用状況メトリクス項目。"""
    service_code: str
    service_name: str
    year_month: str
    metric_name: str
    quantity: int
    usage_rate: float
    billed_amount: float
    primary_use_case: str | None = None


class DashboardSummaryResponse(BaseModel):
    """ダッシュボードサマリーレスポンス。"""
    tenant_name: str
    total_services: int
    metrics: list[UsageMetricItem]


class UsageTrendItem(BaseModel):
    """月次利用推移項目。"""
    year_month: str
    service_code: str
    quantity: int
    usage_rate: float


class UsagePurposeItem(BaseModel):
    """利用目的別集計項目。"""
    primary_use_case: str
    count: int
    percentage: float
```

### Step 4: Motor サービス層の生成

```python
# app/services/portal_dashboard_service.py
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_dashboard_summary(
    db: AsyncIOMotorDatabase, tenant_id: str
) -> dict:
    """テナントのダッシュボードサマリーを取得する。"""
    # テナント情報
    tenant = await db["portal_tenants"].find_one(
        {"_id": ObjectId(tenant_id)}
    )
    tenant_name = tenant["tenant_name"] if tenant else "不明"

    # 契約サービス数
    total_services = await db["portal_subscriptions"].count_documents(
        {"tenant_id": ObjectId(tenant_id), "status": "active"}
    )

    # 最新月の利用メトリクス
    cursor = db["portal_usage_metrics"].find(
        {"tenant_id": ObjectId(tenant_id)}
    ).sort("year_month", -1).limit(20)
    metrics_docs = await cursor.to_list(length=20)

    metrics = []
    for doc in metrics_docs:
        # サービス名を取得
        sub = await db["portal_subscriptions"].find_one(
            {"_id": doc.get("subscription_id")}
        )
        metrics.append({
            "service_code": doc["service_code"],
            "service_name": sub["service_name"] if sub else doc["service_code"],
            "year_month": doc["year_month"],
            "metric_name": doc["metric_name"],
            "quantity": doc["quantity"],
            "usage_rate": doc.get("usage_rate", 0),
            "billed_amount": doc.get("billed_amount", 0),
            "primary_use_case": doc.get("primary_use_case"),
        })

    return {
        "tenant_name": tenant_name,
        "total_services": total_services,
        "metrics": metrics,
    }


async def get_usage_trends(
    db: AsyncIOMotorDatabase, tenant_id: str
) -> list[dict]:
    """テナントの月次利用推移を取得する。"""
    cursor = db["portal_usage_metrics"].find(
        {"tenant_id": ObjectId(tenant_id)}
    ).sort("year_month", 1)
    docs = await cursor.to_list(length=200)

    return [
        {
            "year_month": doc["year_month"],
            "service_code": doc["service_code"],
            "quantity": doc["quantity"],
            "usage_rate": doc.get("usage_rate", 0),
        }
        for doc in docs
    ]


async def get_usage_by_purpose(
    db: AsyncIOMotorDatabase, tenant_id: str
) -> list[dict]:
    """テナントの利用目的別集計を取得する。"""
    pipeline = [
        {"$match": {"tenant_id": ObjectId(tenant_id), "primary_use_case": {"$ne": None}}},
        {"$group": {"_id": "$primary_use_case", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await db["portal_usage_metrics"].aggregate(pipeline).to_list(length=50)

    total = sum(r["count"] for r in results)
    return [
        {
            "primary_use_case": r["_id"],
            "count": r["count"],
            "percentage": round(r["count"] / total * 100, 1) if total > 0 else 0,
        }
        for r in results
    ]
```

### Step 5: APIRouter エンドポイントの生成

```python
# app/routers/portal_dashboard.py
from fastapi import APIRouter, Depends
from ..dependencies.portal_auth import get_current_portal_user, PortalUser
from ..core.database import get_database
from ..schemas.portal_dashboard import (
    DashboardSummaryResponse,
    UsageTrendItem,
    UsagePurposeItem,
)
from ..services import portal_dashboard_service as dashboard_svc

router = APIRouter(prefix="/api/portal/dashboard", tags=["ポータル-ダッシュボード"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> dict:
    """テナント利用状況サマリーを取得する。"""
    db = get_database()
    return await dashboard_svc.get_dashboard_summary(db, current_user.tenant_id)


@router.get("/trends", response_model=list[UsageTrendItem])
async def get_usage_trends(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> list[dict]:
    """月次利用推移データを取得する。"""
    db = get_database()
    return await dashboard_svc.get_usage_trends(db, current_user.tenant_id)


@router.get("/usage-by-purpose", response_model=list[UsagePurposeItem])
async def get_usage_by_purpose(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> list[dict]:
    """利用目的別集計を取得する。"""
    db = get_database()
    return await dashboard_svc.get_usage_by_purpose(db, current_user.tenant_id)
```

### Step 6: `main.py` へのルーター登録

```python
# main.py に追加
from app.routers.portal_auth import router as portal_auth_router
from app.routers.portal_dashboard import router as portal_dashboard_router
from app.routers.portal_services import router as portal_services_router

app.include_router(portal_auth_router)
app.include_router(portal_dashboard_router)
app.include_router(portal_services_router)
```

### Step 7: 動作確認

```bash
cd src/backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI 自動生成ドキュメントで確認: `http://localhost:8000/docs`

ポータル API のみ表示: タグ「ポータル-認証」「ポータル-ダッシュボード」「ポータル-サービス」を確認

## 管理アプリ (fastapi-crud) との違い

| 項目 | fastapi-crud | portal-api-crud |
|------|-------------|-----------------|
| API プレフィックス | `/api/<collection>` | `/api/portal/<resource>` |
| コレクション | `products`, `customers` 等 | `portal_*` |
| 認証依存 | `get_current_user` / `require_admin` | `get_current_portal_user` / `require_portal_admin` |
| データスコープ | ロールベース | テナントスコープ (`tenant_id` フィルタ) |
| JWT ペイロード | `sub` (email) | `sub` (user_id), `tenant_id`, `tenant_code`, `role` |

## チェックリスト

- [ ] テナントスコープ認証 (`portal_auth.py`) を作成した
- [ ] スキーマ (`schemas/portal_*.py`) を定義した
- [ ] サービス層 (`services/portal_*.py`) で全クエリに `tenant_id` フィルタを適用している
- [ ] ルーター (`routers/portal_*.py`) に `/api/portal/` プレフィックスを設定した
- [ ] `main.py` に `include_router()` を追加した
- [ ] 管理者限定操作に `require_portal_admin` を適用した
- [ ] エラー時に `HTTPException` を適切な status_code で raise している
- [ ] `http://localhost:8000/docs` でポータル API を確認した

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| 401 Unauthorized | JWT に `tenant_id` がない | `create_portal_access_token()` で `tenant_id` を含めているか確認 |
| 403 Forbidden | `member` ロールで管理者操作 | `require_portal_admin` の適用エンドポイントを確認 |
| 他テナントのデータが見える | サービス層で `tenant_id` フィルタ漏れ | 全クエリに `{"tenant_id": ObjectId(tenant_id)}` を含めているか確認 |
| `portal_users` が見つからない | コレクション未作成 | MongoDB で `portal_` コレクションの存在を確認 |
| JWT ペイロード不一致 | 管理アプリの JWT を使用 | `/api/portal/auth/login` でポータル専用トークンを取得 |
| 集計が遅い | インデックス未作成 | `docs/specs/saas-portal-mobile-app/system/03-data-model.md` のインデックス設計に従い作成 |

## References

- **データモデル**: [docs/specs/saas-portal-mobile-app/system/03-data-model.md](../../../docs/specs/saas-portal-mobile-app/system/03-data-model.md)
- **認証・API 設計**: [docs/specs/saas-portal-mobile-app/system/04-auth-design.md](../../../docs/specs/saas-portal-mobile-app/system/04-auth-design.md)
- **ポータル Backend 規約**: [.github/instructions/portal-backend.instructions.md](../../instructions/portal-backend.instructions.md)
- **ポータル MongoDB 規約**: [.github/instructions/portal-mongodb.instructions.md](../../instructions/portal-mongodb.instructions.md)
- **既存 fastapi-crud スキル**: [.github/skills/fastapi-crud/SKILL.md](../fastapi-crud/SKILL.md)
