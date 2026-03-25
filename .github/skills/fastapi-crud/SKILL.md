---
name: fastapi-crud
description: >-
  FastAPI + Pydantic v2 + Motor (非同期 MongoDB) を使用した CRUD エンドポイントを生成するスキル。
  JWT 認可付き APIRouter、Pydantic スキーマ (バリデーション制約付き)、Motor サービス層をセットで生成する。
  Use when asked to create, add, or implement API endpoints, CRUD operations,
  database models, backend features, or REST APIs for the FastAPI backend.
  Keywords: endpoint, route, schema, service, MongoDB collection, REST API.
---

# FastAPI CRUD 生成スキル

FastAPI の CRUD エンドポイントを生成する。Pydantic v2 スキーマ、Motor 非同期サービス、
JWT 依存性注入をセットで生成し、`src/backend/app/` の適切なモジュールに配置する。

## このスキルを使うタイミング

- **新しい MongoDB コレクション**の CRUD エンドポイントを追加するとき
- **Pydantic スキーマ** (リクエスト/レスポンス) を生成するとき
- **Motor** を使った非同期データベース操作を実装するとき
- **JWT 認可**付きエンドポイントを追加するとき
- 既存エンドポイントに **バリデーション・エラーハンドリング** を追加するとき

## 前提条件

- `src/backend/pyproject.toml` に fastapi, motor, pydantic, python-jose, passlib が含まれること
- バックエンドは `uv sync` でセットアップ済みであること
- MongoDB は `localhost:27017` で起動中であること (DevContainer で自動起動)

## プロジェクト構造 (目標)

```
src/backend/
├── main.py                      # FastAPI アプリ起動、ルーター登録
├── pyproject.toml
└── app/
    ├── core/
    │   ├── config.py            # BaseSettings による環境変数管理
    │   ├── database.py          # Motor クライアント・DB 依存性
    │   └── security.py          # JWT 生成・検証、パスワードハッシュ
    ├── models/
    │   └── <collection>.py      # MongoDB ドキュメント型定義
    ├── schemas/
    │   └── <collection>.py      # Pydantic v2 リクエスト/レスポンス
    ├── routers/
    │   └── <collection>.py      # APIRouter エンドポイント定義
    ├── services/
    │   └── <collection>.py      # Motor CRUD サービス層
    └── dependencies/
        └── auth.py              # Depends(get_current_user) 等
```

## ワークフロー

### TODO
- [ ] Step 1: 対象コレクションの仕様確認
- [ ] Step 2: 基盤モジュールの作成 (未作成の場合)
- [ ] Step 3: Pydantic スキーマの生成
- [ ] Step 4: Motor サービス層の生成
- [ ] Step 5: APIRouter エンドポイントの生成
- [ ] Step 6: `main.py` へのルーター登録
- [ ] Step 7: 動作確認

### Step 1: 対象コレクションの仕様確認

以下を確認してから実装を開始する:

- **コレクション名**: `docs/specs/saas-management-app/system/03-data-model.md` で定義済み
- **フィールド定義**: JSON スキーマを確認する
- **参照関係**: 他コレクションへの `ObjectId` 参照を確認する
- **ロール要件**: 営業担当者/管理者どちらが操作できるか

対象コレクション一覧:

| コレクション | 主な操作 | 必要ロール |
|------------|---------|---------|
| `products` | CRUD | 管理者 (CUD) / 全員 (R) |
| `plans` | CRUD | 管理者 (CUD) / 全員 (R) |
| `customers` | CRUD | 管理者 (CUD) / 担当者自身 (RU) |
| `contracts` | CRUD | 管理者 (全) / 担当者 (担当顧客のみ) |
| `monthly_usage` | CR (CSV import) | 担当者以上 |
| `metrics_definitions` | CRUD | 管理者のみ |

### Step 2: 基盤モジュールの作成 (未作成の場合)

必要に応じて以下の基盤モジュールを先に作成する:

#### `app/core/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "saas_management"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8時間


settings = Settings()
```

#### `app/core/database.py`

```python
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url)
    return _client


async def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.database_name]
```

#### `app/core/security.py`

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
```

#### `app/dependencies/auth.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.database import get_db
from ..core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db["users"].find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    return user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )
    return current_user
```

### Step 3: Pydantic スキーマの生成

`app/schemas/<collection>.py` を作成する。リクエスト用 (`Create`, `Update`) と
レスポンス用 (`Response`) を分離する。

```python
# app/schemas/product.py
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class ProductCreate(BaseModel):
    product_code: str = Field(..., description="製品コード（ユニーク）")
    product_name: str = Field(..., description="製品名")
    category: str = Field(..., description="カテゴリ")
    vendor: str = Field(..., description="ベンダー")


class ProductUpdate(BaseModel):
    product_name: str | None = None
    category: str | None = None
    vendor: str | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    product_code: str
    product_name: str
    category: str
    vendor: str
    created_at: datetime
    updated_at: datetime
```

### Step 4: Motor サービス層の生成

`app/services/<collection>.py` を作成する。Motor の非同期 API を使用する。

```python
# app/services/product.py
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import HTTPException, status
from ..schemas.product import ProductCreate, ProductUpdate


async def get_all_products(db: AsyncIOMotorDatabase) -> list[dict]:
    cursor = db["products"].find({})
    products = await cursor.to_list(length=100)
    for p in products:
        p["_id"] = str(p["_id"])
    return products


async def get_product_by_id(db: AsyncIOMotorDatabase, product_id: str) -> dict:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="無効な ID")

    product = await db["products"].find_one({"_id": oid})
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="製品が見つかりません")
    product["_id"] = str(product["_id"])
    return product


async def create_product(db: AsyncIOMotorDatabase, data: ProductCreate) -> dict:
    now = datetime.now(timezone.utc)
    doc = {**data.model_dump(), "created_at": now, "updated_at": now}
    result = await db["products"].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_product(
    db: AsyncIOMotorDatabase, product_id: str, data: ProductUpdate
) -> dict:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="無効な ID")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db["products"].find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="製品が見つかりません")
    result["_id"] = str(result["_id"])
    return result


async def delete_product(db: AsyncIOMotorDatabase, product_id: str) -> None:
    try:
        oid = ObjectId(product_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="無効な ID")

    result = await db["products"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="製品が見つかりません")
```

### Step 5: APIRouter エンドポイントの生成

`app/routers/<collection>.py` を作成する。

```python
# app/routers/products.py
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.database import get_db
from ..dependencies.auth import get_current_user, require_admin
from ..schemas.product import ProductCreate, ProductUpdate, ProductResponse
from ..services import product as product_service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[dict]:
    return await product_service.get_all_products(db)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> dict:
    return await product_service.get_product_by_id(db, product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
) -> dict:
    return await product_service.create_product(db, data)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
) -> dict:
    return await product_service.update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: dict = Depends(require_admin),
) -> None:
    await product_service.delete_product(db, product_id)
```

### Step 6: `main.py` へのルーター登録

```python
# main.py
from fastapi import FastAPI
from app.routers import products  # 追加したルーターを import

app = FastAPI(
    title="SaaS管理アプリ API",
    version="0.1.0",
)

app.include_router(products.router)  # ルーターを登録
```

### Step 7: 動作確認

```bash
cd src/backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI の自動生成ドキュメントで確認: `http://localhost:8000/docs`

## チェックリスト

- [ ] スキーマ (`schemas/`) に Create / Update / Response を定義した
- [ ] サービス層 (`services/`) に Motor 非同期 CRUD を実装した
- [ ] ルーター (`routers/`) に APIRouter で REST エンドポイントを定義した
- [ ] `main.py` に `include_router()` を追加した
- [ ] 管理者ロールが必要な操作に `require_admin` を適用した
- [ ] エラー時に `HTTPException` を適切な status_code で raise している
- [ ] `updated_at` を更新時に自動設定している
- [ ] `http://localhost:8000/docs` でエンドポイントを確認した

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `ModuleNotFoundError` | 依存パッケージ未インストール | `cd src/backend && uv sync` を実行 |
| `ImportError: cannot import name` | モジュールパス誤り | `app/` 配下の相対インポートパスを確認 |
| 422 Unprocessable Entity | リクエストボディが Pydantic スキーマに不一致 | `http://localhost:8000/docs` でスキーマを確認 |
| 401 Unauthorized | JWT トークン未設定 or 期限切れ | `/api/auth/token` でトークンを再取得 |
| 403 Forbidden | ロール権限不足 | `require_admin` 依存を確認、管理者ユーザーで操作 |
| MongoDB 接続エラー | MongoDB 未起動 or URL 誤り | `mongosh` で接続確認、`.env` の `MONGODB_URL` を確認 |
| `bson.errors.InvalidId` | 不正な ObjectId 文字列 | パスパラメータの形式を確認（24文字の16進数） |
| ルーターが反映されない | `include_router()` 未追加 | `main.py` に `app.include_router(xxx.router)` を追加 |
