---
name: dev-implement
description: >-
  docs/specs/{feature}/plan/ の開発計画をもとにバックエンド (FastAPI) と
  フロントエンド (React) の実装を行うスキル。並行実行可能なタスクは同時に進め、
  各実装後に批判的レビューを行う。
  パイプライン: dev-plan → [dev-implement] → dev-unit-test → playwright-generate-test
  ⚠ このスキルは「[dev-implement] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: dev-implement, docs/specs.
---

# 開発実装スキル

`docs/specs/{feature}/plan/` の開発計画を入力とし、バックエンド (FastAPI + Motor)
とフロントエンド (React + TypeScript) の実装を行う。

## 呼び出し規約

> **このスキルは `[dev-implement] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[dev-implement] saas-management-app` | ✅ 実行する — `docs/specs/saas-management-app/plan/` を参照 |
| `[dev-implement] billing-feature` | ✅ 実行する — `docs/specs/billing-feature/plan/` を参照 |
| `この機能を実装して` | ❌ 実行しない — `[dev-implement]` プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[dev-implement] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/summary.md` が存在しない場合は、先に `[dev-plan] {feature}` を実行するよう案内する
3. `{feature}` が空の場合は、`docs/specs/` 配下の plan 付きディレクトリ一覧を提示する

## パイプラインにおける位置づけ

```
dev-plan → [dev-implement] → dev-unit-test → playwright-generate-test
                ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **このスキル (dev-implement)**: 計画をもとにバックエンド・フロントエンドを実装する
3. **dev-unit-test**: 実装に対して単体テストを構築する
4. **playwright-generate-test**: 計画の Acceptance Criteria をもとに E2E テストを構築する

`{feature}` はユーザーが指定する機能ディレクトリ名（例: `saas-management-app`）。

## このスキルを使うタイミング

- `docs/specs/{feature}/plan/` の開発計画に基づいて **機能を実装** するとき
- **バックエンド API** と **フロントエンド UI** をセットで構築するとき
- 計画の **Wave 単位で並行実装** を進めるとき

## 前提条件

- `docs/specs/{feature}/plan/` に dev-plan スキルの出力が存在すること
- `src/backend/` で `uv sync` が完了していること
- `src/frontend/` で `npm install` が完了していること
- MongoDB が `localhost:27017` で起動中であること

## プロジェクト構造

### バックエンド

```
src/backend/
├── main.py
├── pyproject.toml
└── app/
    ├── core/
    │   ├── config.py            # BaseSettings (環境変数)
    │   ├── database.py          # Motor クライアント
    │   └── security.py          # JWT / bcrypt
    ├── schemas/
    │   └── {collection}.py      # Pydantic v2 スキーマ
    ├── routers/
    │   └── {collection}.py      # APIRouter エンドポイント
    ├── services/
    │   └── {collection}.py      # Motor CRUD サービス
    └── dependencies/
        └── auth.py              # get_current_user, require_admin
```

### フロントエンド

```
src/frontend/src/
├── App.tsx                      # ルーティング (React Router v7)
├── api/
│   └── {feature}.ts             # API クライアント関数
├── components/
│   ├── layout/
│   │   └── Layout.tsx           # 共通レイアウト
│   ├── ui/                      # 汎用 UI コンポーネント
│   └── {Feature}/               # 機能別コンポーネント
├── hooks/
│   └── use{Feature}.ts          # カスタムフック
├── pages/
│   └── {Feature}Page.tsx        # ページコンポーネント
└── types/
    └── api.ts                   # API 型定義
```

## ワークフロー

### Step 0: 計画の読み込みと実装方針の確認

- [ ] `docs/specs/{feature}/plan/summary.md` を読み、全体構造を把握する
- [ ] 各タスクファイル (`task-NN-*.md`) のスコープと AC を確認する
- [ ] Wave 順序に従い、実装順序を決定する
- [ ] 共通基盤（認証、DB接続、共通UIコンポーネント）が未実装なら最優先で作成する

### Step 1: 共通基盤の構築（未整備の場合）

以下が未作成の場合は最初に作成する。

#### バックエンド基盤

**app/core/config.py:**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "saas_management"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
```

**app/core/database.py:**

```python
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

client: AsyncIOMotorClient | None = None

async def get_database() -> AsyncIOMotorDatabase:
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
    return client[settings.DATABASE_NAME]

async def close_database() -> None:
    global client
    if client is not None:
        client.close()
        client = None
```

**app/core/security.py:**

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
```

**app/dependencies/auth.py:**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.core.security import decode_access_token
from app.core.database import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = await db["users"].find_one({"_id": ObjectId(user_id), "is_active": True})
    if user is None:
        raise credentials_exception
    user["_id"] = str(user["_id"])
    return user

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )
    return current_user
```

#### フロントエンド基盤

**api/client.ts:**

```typescript
const API_BASE = '/api'

function getAuthHeaders(): HeadersInit {
  const token = sessionStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
  return res.json()
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
  return res.json()
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
  return res.json()
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
  return res.json()
}
```

### Step 2: タスク単位の実装

Wave 順序に従い、各タスクを以下の手順で実装する。
並行実行可のタスクは **同一 Wave 内で同時に実装する**。

#### 2-1. バックエンド実装

各タスクについて以下を作成する。

**Pydantic スキーマ (`app/schemas/{collection}.py`):**

```python
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class ProductCreate(BaseModel):
    product_code: str = Field(..., min_length=1, description="製品コード")
    product_name: str = Field(..., min_length=1)
    category: str
    vendor: str

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
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

**Motor サービス (`app/services/{collection}.py`):**

```python
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

async def get_all_products(db: AsyncIOMotorDatabase, active_only: bool = True) -> list[dict]:
    query = {"is_active": True} if active_only else {}
    cursor = db["products"].find(query)
    products = await cursor.to_list(length=1000)
    for p in products:
        p["_id"] = str(p["_id"])
    return products

async def get_product_by_id(db: AsyncIOMotorDatabase, product_id: str) -> dict | None:
    product = await db["products"].find_one({"_id": ObjectId(product_id)})
    if product:
        product["_id"] = str(product["_id"])
    return product

async def create_product(db: AsyncIOMotorDatabase, data: dict) -> str:
    now = datetime.now(timezone.utc)
    data.update({"is_active": True, "created_at": now, "updated_at": now})
    result = await db["products"].insert_one(data)
    return str(result.inserted_id)

async def update_product(db: AsyncIOMotorDatabase, product_id: str, data: dict) -> bool:
    data["updated_at"] = datetime.now(timezone.utc)
    result = await db["products"].update_one(
        {"_id": ObjectId(product_id)},
        {"$set": data},
    )
    return result.modified_count > 0
```

**APIRouter (`app/routers/{collection}.py`):**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_database
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.products import ProductCreate, ProductUpdate, ProductResponse
from app.services import products as product_service

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=list[ProductResponse])
async def list_products(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(get_current_user),
):
    return await product_service.get_all_products(db)

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    existing = await db["products"].find_one({"product_code": body.product_code})
    if existing:
        raise HTTPException(status_code=409, detail="この製品コードは既に使用されています")
    product_id = await product_service.create_product(db, body.model_dump())
    return {"id": product_id}

@router.patch("/{product_id}", response_model=dict)
async def update_product(
    product_id: str,
    body: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="更新するフィールドがありません")
    success = await product_service.update_product(db, product_id, update_data)
    if not success:
        raise HTTPException(status_code=404, detail="製品が見つかりません")
    return {"id": product_id}
```

**main.py へのルーター登録:**

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.database import close_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_database()

app = FastAPI(title="SaaS Management API", lifespan=lifespan)

# ルーター登録
from app.routers import products, plans, customers, contracts, monthly_usage, auth
app.include_router(auth.router)
app.include_router(products.router)
# ... 他のルーターも同様に登録
```

#### 2-2. フロントエンド実装

各タスクについて以下を作成する。

**型定義 (`types/api.ts`):**

```typescript
export interface Product {
  id: string
  product_code: string
  product_name: string
  category: string
  vendor: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**カスタムフック (`hooks/useProducts.ts`):**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../api/client'
import type { Product } from '../types/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<Product[]>('/products')
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  return { products, loading, error, refetch: fetchProducts }
}
```

**ページコンポーネント (`pages/ProductsPage.tsx`):**

```tsx
import { useProducts } from '../hooks/useProducts'

export function ProductsPage() {
  const { products, loading, error, refetch } = useProducts()

  if (loading) return <div className="p-6">読み込み中...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">製品マスタ</h1>
      {/* テーブル・フォーム等の実装 */}
    </div>
  )
}
```

**Recharts グラフ（ダッシュボード）:**

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface TrendChartProps {
  data: { month: string; usage_rate: number }[]
}

export function UsageTrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[0, 120]} />
        <Tooltip />
        <Line type="monotone" dataKey="usage_rate" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Step 3: 動作確認

各タスクの実装後、以下を確認する。

- [ ] バックエンド: `cd src/backend && uv run uvicorn main:app --reload --port 8000`
- [ ] フロントエンド: `cd src/frontend && npm run dev`
- [ ] TypeScript ビルド: `cd src/frontend && npx tsc --noEmit`
- [ ] API 疎通: `curl -s http://localhost:8000/docs` で OpenAPI ドキュメントが表示される
- [ ] 画面表示: `http://localhost:5173` でフロントエンドが表示される

### Step 4: 批判的レビュー（1回目）

以下の観点でレビューする。

- [ ] **API 設計:** RESTful な URL 設計か、レスポンスコードは適切か
- [ ] **型安全性:** Pydantic スキーマとフロントエンド型定義が一致しているか
- [ ] **認証・認可:** 全エンドポイントに適切な権限チェックがあるか
- [ ] **エラーハンドリング:** バリデーションエラー、404、409 等が適切にハンドリングされているか
- [ ] **非同期処理:** Motor 操作に `await` が漏れていないか
- [ ] **フロントエンド状態管理:** ローディング・エラー・空状態が適切に処理されているか
- [ ] **Tailwind CSS:** インラインスタイルが使用されていないか
- [ ] **`any` 型:** TypeScript で `any` が使われていないか

### Step 5: 修正と最終レビュー（必要な場合のみ・最大1回追加）

レビューで発見した問題を修正し、再度レビューする。2回のレビューを上限とする。

## コーディング規約

### バックエンド

- すべての関数に **型ヒント** を付ける
- FastAPI ルートは `async def` とする
- Pydantic v2: `model_config = ConfigDict(populate_by_name=True)` を使用する
- MongoDB の `_id` は `str(ObjectId)` で変換してレスポンスに含める
- エラーは `HTTPException` で返す
- `created_at` / `updated_at` は UTC で保存する
- 削除は論理削除 (`is_active = False`) を基本とする

### フロントエンド

- **関数コンポーネント** のみ使用する（クラスコンポーネント禁止）
- ファイル命名: コンポーネント `PascalCase.tsx`、フック `use{Name}.ts`
- **`any` 型禁止**、API レスポンスは必ず型定義を作成する
- Tailwind CSS のユーティリティクラスを使用する（インラインスタイル禁止）
- Recharts は必ず `ResponsiveContainer` でラップする

## チェックリスト

- [ ] 計画の全タスクが実装されている
- [ ] バックエンドが `uvicorn` で起動できる
- [ ] フロントエンドが `npm run dev` で起動できる
- [ ] TypeScript のビルドエラーがない (`npx tsc --noEmit`)
- [ ] 批判的レビューを1回以上実施済み
- [ ] Acceptance Criteria の各項目が手動で確認可能な状態

## トラブルシューティング

| 症状 | 原因 | 対応 |
|------|------|------|
| `ModuleNotFoundError` | パッケージ未インストール | `cd src/backend && uv add {package}` |
| Pydantic `ValidationError` | スキーマとリクエストの不一致 | リクエストボディのフィールド名・型を確認 |
| `401 Unauthorized` | トークン未設定 or 期限切れ | ログインして `sessionStorage` にトークンを保存 |
| `403 Forbidden` | ロール不足 | エンドポイントの認可設定を確認 |
| CORS エラー | Vite proxy 未設定 | `vite.config.ts` の proxy 設定を確認 |
| MongoDB 接続エラー | DB 未起動 | `mongosh` で接続確認 |
| `ObjectId` 変換エラー | 不正な ID 形式 | `bson.ObjectId.is_valid()` でバリデーション |
| Recharts が表示されない | `ResponsiveContainer` 不足 | 親要素に width/height を設定する |
