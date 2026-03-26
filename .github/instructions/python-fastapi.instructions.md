---
description: 'Python 3.12 + FastAPI + Pydantic v2 + Motor (非同期 MongoDB) のバックエンド開発規約'
applyTo: 'src/backend/**/*.py'
---

# Python / FastAPI 開発規約

## プロジェクト構造

```
src/backend/
├── main.py               # FastAPI アプリ起動、ルーター登録
├── pyproject.toml        # 依存関係 (uv で管理)
├── app/
│   ├── core/
│   │   ├── config.py     # pydantic-settings による環境変数管理
│   │   ├── database.py   # Motor クライアント・DB 接続
│   │   └── security.py   # JWT トークン生成・検証、パスワードハッシュ
│   ├── models/
│   │   └── *.py          # MongoDB ドキュメントモデル (PyObjectId 等)
│   ├── schemas/
│   │   └── *.py          # Pydantic v2 リクエスト/レスポンススキーマ
│   ├── routers/
│   │   └── *.py          # APIRouter — エンドポイント定義
│   ├── services/
│   │   └── *.py          # ビジネスロジック・Motor CRUD
│   └── dependencies/
│       └── auth.py       # Depends(get_current_user) 等の共通依存
```

## コーディング規約

- **型ヒント必須**: すべての関数引数・戻り値に型アノテーションを付ける
- **非同期優先**: FastAPI ルートは `async def`、Motor 操作は `await` を使用する
- **docstring**: 公開関数・クラスに Google スタイルの docstring を付ける
- **import 順序**: 標準ライブラリ → サードパーティ → ローカル（ruff isort 準拠）
- **環境変数**: `pydantic-settings` の `BaseSettings` で `.env` から読み込む
- **エラーハンドリング**: `raise HTTPException(status_code=..., detail=...)` を使用する
- **APIRouter**: 機能ごとにルーターを分割し、`prefix` と `tags` を設定する
- **依存性注入**: 認証ユーザーは `Depends(get_current_user)` で取得する
- **datetime**: `datetime.now(timezone.utc)` を使用する（`datetime.utcnow()` は非推奨）

## Pydantic v2 スキーマ

リクエスト用 (`Create`, `Update`) とレスポンス用 (`Response`) を分離する。

### Good Example

```python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class ProductCreate(BaseModel):
    """製品作成リクエスト。"""
    product_code: str = Field(..., min_length=1, max_length=50, description="製品コード（ユニーク）")
    product_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1)
    vendor: str = Field(..., min_length=1)

class ProductUpdate(BaseModel):
    """製品更新リクエスト。None のフィールドは更新しない。"""
    product_name: str | None = Field(None, min_length=1, max_length=200)
    category: str | None = None
    vendor: str | None = None

class ProductResponse(BaseModel):
    """製品レスポンス。"""
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    product_code: str
    product_name: str
    category: str
    vendor: str
    created_at: datetime
    updated_at: datetime
```

### Bad Example

```python
# Field 制約なし — 空文字やバリデーション不足
class ProductCreate(BaseModel):
    product_code: str
    product_name: str
    category: str
    vendor: str
```

## Motor (非同期 MongoDB)

```python
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone

async def get_products(db: AsyncIOMotorDatabase) -> list[dict]:
    """全製品を取得する。"""
    cursor = db["products"].find({})
    products = await cursor.to_list(length=100)
    for p in products:
        p["_id"] = str(p["_id"])
    return products

async def create_product(db: AsyncIOMotorDatabase, data: dict) -> str:
    """製品を作成し、挿入された ID を返す。"""
    now = datetime.now(timezone.utc)
    data["created_at"] = now
    data["updated_at"] = now
    result = await db["products"].insert_one(data)
    return str(result.inserted_id)
```

## JWT 認証パターン

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Bearer トークンから現在のユーザーを取得する。"""
    ...
```

## テスト

- `pytest` + `httpx.AsyncClient` で非同期テストを書く
- テストファイルは `src/backend/tests/` に配置する
- テスト関数名は `test_<対象>_<状況>_<期待結果>` 形式にする
- 各テストの独立性を保つ（テスト用 DB のクリーンアップ）

```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.anyio
async def test_get_products_returns_empty_list_when_no_data():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/products")
    assert response.status_code == 200
    assert response.json() == []
```

## Validation

- lint / format: `cd src/backend && uv run ruff check . && uv run ruff format --check .`
- 型チェック: `cd src/backend && uv run pyright`
- テスト: `cd src/backend && uv run pytest`
- サーバー起動: `cd src/backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
