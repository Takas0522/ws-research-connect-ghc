---
name: dev-unit-test
description: >-
  docs/specs/{feature}/plan/ の Acceptance Criteria と実装コードをもとに、
  バックエンド (pytest + httpx) とフロントエンド (Vitest + React Testing Library) の
  単体テストを構築するスキル。ホワイトボックス・ブラックボックス両観点でテストを作成し、
  テストが通るまで修正する。
  パイプライン: dev-plan → dev-implement → [dev-unit-test] → playwright-generate-test
  ⚠ このスキルは「[dev-unit-test] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: dev-unit-test, docs/specs.
---

# 単体テスト構築スキル

`docs/specs/{feature}/plan/` の開発計画と実装コードを入力とし、
バックエンド (pytest + httpx.AsyncClient) と
フロントエンド (Vitest + React Testing Library) の単体テストを構築する。

## 呼び出し規約

> **このスキルは `[dev-unit-test] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[dev-unit-test] saas-management-app` | ✅ 実行する — `docs/specs/saas-management-app/plan/` と実装コードを対象 |
| `テストを書いて` | ❌ 実行しない — `[dev-unit-test]` プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[dev-unit-test] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/` が存在しない場合は、先に `[dev-plan] {feature}` を実行するよう案内する
3. `src/backend/app/` にルーターやサービスが存在しない場合は、先に `[dev-implement] {feature}` を実行するよう案内する

## パイプラインにおける位置づけ

```
dev-plan → dev-implement → [dev-unit-test] → playwright-generate-test
                                ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **dev-implement**: 計画をもとにバックエンド・フロントエンドを実装済み
3. **このスキル (dev-unit-test)**: 実装に対して単体テストを構築する
4. **playwright-generate-test**: 計画の Acceptance Criteria をもとに E2E テストを構築する

`{feature}` はユーザーが指定する機能ディレクトリ名（例: `saas-management-app`）。

## このスキルを使うタイミング

- `docs/specs/{feature}/plan/` の AC と実装コードをもとに **単体テスト** を作成するとき
- バックエンド API の **単体テスト** を作成するとき
- フロントエンドのコンポーネント・フックの **単体テスト** を作成するとき
- **ホワイトボックステスト** (内部ロジック検証) を追加するとき
- **ブラックボックステスト** (API 契約・UI 振る舞い検証) を追加するとき

## 前提条件

### バックエンド

- `src/backend/` に FastAPI アプリが実装済みであること
- テスト依存パッケージを追加する:

```bash
cd src/backend
uv add --dev pytest pytest-asyncio httpx mongomock-motor
```

### フロントエンド

- `src/frontend/` に React アプリが実装済みであること
- テスト依存パッケージを追加する:

```bash
cd src/frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

## プロジェクト構造

### バックエンド テスト

```
src/backend/
├── tests/
│   ├── conftest.py              # 共通フィクスチャ (テスト用DB・クライアント・認証)
│   ├── test_products.py         # 製品マスタ API テスト
│   ├── test_plans.py            # 課金プラン API テスト
│   ├── test_customers.py        # 顧客マスタ API テスト
│   ├── test_contracts.py        # 契約管理 API テスト
│   ├── test_monthly_usage.py    # 月次従量実績 API テスト
│   ├── test_auth.py             # 認証エンドポイント テスト
│   └── test_csv_import.py       # CSV 取込ロジック テスト
└── pyproject.toml               # pytest 設定追加
```

### フロントエンド テスト

```
src/frontend/
├── vitest.config.ts             # Vitest 設定
├── src/
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   └── useProducts.test.ts  # フック テスト
│   ├── components/
│   │   ├── ProductTable.tsx
│   │   └── ProductTable.test.tsx # コンポーネント テスト
│   ├── api/
│   │   ├── client.ts
│   │   └── client.test.ts       # API クライアント テスト
│   └── utils/
│       ├── format.ts
│       └── format.test.ts       # ユーティリティ テスト
└── package.json                 # test スクリプト追加
```

## ワークフロー

### Step 0: テスト基盤のセットアップ

#### バックエンド: pytest 設定

**pyproject.toml に追加:**

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
```

**tests/conftest.py:**

```python
import asyncio
from collections.abc import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient

from app.core.config import settings
from app.core.database import get_database
from app.core.security import get_password_hash, create_access_token
from main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
async def mock_db():
    """mongomock による in-memory MongoDB を提供する。"""
    client = AsyncMongoMockClient()
    db = client[settings.DATABASE_NAME]
    yield db
    client.close()


@pytest.fixture()
async def client(mock_db) -> AsyncGenerator[AsyncClient, None]:
    """テスト用 HTTP クライアント。DB を mock に差し替える。"""
    async def override_get_database():
        return mock_db

    app.dependency_overrides[get_database] = override_get_database

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture()
async def admin_token(mock_db) -> str:
    """管理者ユーザーを作成しトークンを返す。"""
    admin = {
        "email": "admin@example.com",
        "display_name": "テスト管理者",
        "role": "admin",
        "password_hash": get_password_hash("admin-password"),
        "is_active": True,
    }
    result = await mock_db["users"].insert_one(admin)
    return create_access_token({"sub": str(result.inserted_id)})


@pytest.fixture()
async def sales_token(mock_db) -> str:
    """営業担当者ユーザーを作成しトークンを返す。"""
    sales = {
        "email": "sales@example.com",
        "display_name": "テスト営業",
        "role": "sales",
        "password_hash": get_password_hash("sales-password"),
        "is_active": True,
    }
    result = await mock_db["users"].insert_one(sales)
    return create_access_token({"sub": str(result.inserted_id)})


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
```

#### フロントエンド: Vitest 設定

**vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/main.tsx'],
    },
  },
})
```

**src/test-setup.ts:**

```typescript
import '@testing-library/jest-dom'
```

**package.json に追加:**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 1: テスト対象の分析

- [ ] `docs/specs/{feature}/plan/` からタスクの AC を確認する
- [ ] 実装コードを読み、テスト対象を洗い出す
- [ ] 各対象について、ホワイトボックス / ブラックボックスの観点を整理する

### Step 2: バックエンド テストの作成

#### ブラックボックステスト（API 契約テスト）

外部から見た API の振る舞いをテストする。

```python
import pytest
from httpx import AsyncClient
from tests.conftest import auth_header


class TestProductsAPI:
    """製品マスタ API のブラックボックステスト"""

    async def test_list_products_empty(self, client: AsyncClient, admin_token: str):
        """製品が0件のとき空リストが返る"""
        res = await client.get("/api/products", headers=auth_header(admin_token))
        assert res.status_code == 200
        assert res.json() == []

    async def test_create_product_success(self, client: AsyncClient, admin_token: str):
        """正常な製品データで201が返る"""
        payload = {
            "product_code": "CRM001",
            "product_name": "CloudCRM Pro",
            "category": "CRM",
            "vendor": "Example Corp",
        }
        res = await client.post(
            "/api/products", json=payload, headers=auth_header(admin_token)
        )
        assert res.status_code == 201
        assert "id" in res.json()

    async def test_create_product_duplicate_code(self, client: AsyncClient, admin_token: str):
        """重複する製品コードで409が返る"""
        payload = {
            "product_code": "CRM001",
            "product_name": "CloudCRM Pro",
            "category": "CRM",
            "vendor": "Example Corp",
        }
        await client.post("/api/products", json=payload, headers=auth_header(admin_token))
        res = await client.post(
            "/api/products", json=payload, headers=auth_header(admin_token)
        )
        assert res.status_code == 409

    async def test_create_product_requires_admin(self, client: AsyncClient, sales_token: str):
        """営業担当者が製品を作成しようとすると403が返る"""
        payload = {
            "product_code": "CRM002",
            "product_name": "Test Product",
            "category": "CRM",
            "vendor": "Test",
        }
        res = await client.post(
            "/api/products", json=payload, headers=auth_header(sales_token)
        )
        assert res.status_code == 403

    async def test_list_products_unauthenticated(self, client: AsyncClient):
        """未認証でアクセスすると401が返る"""
        res = await client.get("/api/products")
        assert res.status_code == 401
```

#### ホワイトボックステスト（内部ロジックテスト）

サービス層やユーティリティの内部ロジックを直接テストする。

```python
import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token


class TestSecurity:
    """セキュリティモジュールのホワイトボックステスト"""

    def test_password_hash_roundtrip(self):
        """ハッシュ化 → 検証が成功する"""
        password = "test-password-123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_password_hash_wrong_password(self):
        """異なるパスワードで検証が失敗する"""
        hashed = get_password_hash("correct-password")
        assert verify_password("wrong-password", hashed) is False

    def test_token_roundtrip(self):
        """トークン生成 → デコードで元データが取得できる"""
        data = {"sub": "user123", "role": "admin"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"
        assert "exp" in decoded


class TestProductService:
    """製品サービスのホワイトボックステスト"""

    async def test_create_product_sets_timestamps(self, mock_db):
        """create_product が created_at / updated_at を自動設定する"""
        from app.services.products import create_product

        product_id = await create_product(mock_db, {
            "product_code": "TEST01",
            "product_name": "Test",
            "category": "Test",
            "vendor": "Test",
        })
        product = await mock_db["products"].find_one({"product_code": "TEST01"})
        assert product is not None
        assert product["created_at"] is not None
        assert product["updated_at"] is not None
        assert product["is_active"] is True

    async def test_get_all_products_filters_inactive(self, mock_db):
        """active_only=True のとき非アクティブ製品を除外する"""
        from app.services.products import get_all_products

        await mock_db["products"].insert_many([
            {"product_code": "A", "product_name": "Active", "is_active": True,
             "category": "X", "vendor": "V"},
            {"product_code": "B", "product_name": "Inactive", "is_active": False,
             "category": "X", "vendor": "V"},
        ])
        results = await get_all_products(mock_db, active_only=True)
        assert len(results) == 1
        assert results[0]["product_code"] == "A"
```

### Step 3: フロントエンド テストの作成

#### コンポーネント テスト（ブラックボックス）

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductsPage } from '../pages/ProductsPage'

// API モック
vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

import { apiGet, apiPost } from '../api/client'

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ローディング中にスピナーが表示される', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {})) // never resolves
    render(<ProductsPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('製品一覧が表示される', async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: '1',
        product_code: 'CRM001',
        product_name: 'CloudCRM Pro',
        category: 'CRM',
        vendor: 'Example',
        is_active: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ])
    render(<ProductsPage />)
    await waitFor(() => {
      expect(screen.getByText('CloudCRM Pro')).toBeInTheDocument()
    })
  })

  it('エラー時にエラーメッセージが表示される', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('通信エラー'))
    render(<ProductsPage />)
    await waitFor(() => {
      expect(screen.getByText('通信エラー')).toBeInTheDocument()
    })
  })
})
```

#### フック テスト（ホワイトボックス）

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProducts } from '../hooks/useProducts'

vi.mock('../api/client', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '../api/client'

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初期状態は loading=true, products=[]', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useProducts())
    expect(result.current.loading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('取得成功で products にデータが入り loading=false になる', async () => {
    const mockData = [{ id: '1', product_code: 'CRM001', product_name: 'CloudCRM Pro' }]
    vi.mocked(apiGet).mockResolvedValue(mockData)

    const { result } = renderHook(() => useProducts())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.products).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('取得失敗で error にメッセージが入る', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useProducts())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBe('Network Error')
    expect(result.current.products).toEqual([])
  })

  it('refetch を呼ぶと再取得される', async () => {
    vi.mocked(apiGet).mockResolvedValue([])
    const { result } = renderHook(() => useProducts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(apiGet).mockResolvedValue([{ id: '2' }])
    result.current.refetch()
    await waitFor(() => {
      expect(result.current.products).toEqual([{ id: '2' }])
    })
    expect(apiGet).toHaveBeenCalledTimes(2)
  })
})
```

#### API クライアント テスト（ホワイトボックス）

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiGet, apiPost } from '../api/client'

describe('API Client', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('apiGet がトークン付きで GET リクエストを送信する', async () => {
    sessionStorage.setItem('access_token', 'test-token')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: '1' }]),
    })

    const result = await apiGet('/products')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
    expect(result).toEqual([{ id: '1' }])
  })

  it('apiGet がエラーレスポンスで例外をスローする', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
      json: () => Promise.resolve({ detail: '製品が見つかりません' }),
    })

    await expect(apiGet('/products/invalid')).rejects.toThrow('製品が見つかりません')
  })
})
```

### Step 4: テスト実行と修正

- [ ] バックエンド: `cd src/backend && uv run pytest -v`
- [ ] フロントエンド: `cd src/frontend && npm test`
- [ ] 失敗したテストを修正する（テストかコードのどちらに問題があるか判断）
- [ ] 全テストが通ることを確認する

### Step 5: 批判的レビュー（1回目）

以下の観点でテストをレビューする。

- [ ] **カバレッジ:** 主要なパスがテストされているか（正常系・異常系・境界値）
- [ ] **独立性:** テスト間に依存がないか、順序を変えても通るか
- [ ] **可読性:** テスト名から何をテストしているか分かるか
- [ ] **ブラックボックス観点:** API 契約、UI の見た目の振る舞いが網羅されているか
- [ ] **ホワイトボックス観点:** 内部ロジック、分岐、エッジケースがテストされているか
- [ ] **認証テスト:** 未認証、権限不足のケースがテストされているか
- [ ] **モックの妥当性:** 過剰なモックで本質的なテストが欠落していないか

### Step 6: 修正と最終レビュー（必要な場合のみ・最大1回追加）

レビューで発見した問題を修正し、再度レビューする。2回のレビューを上限とする。

## テスト設計の指針

### ブラックボックス vs ホワイトボックス

| 観点 | ブラックボックス | ホワイトボックス |
|------|----------------|----------------|
| 対象 | API エンドポイント、UIコンポーネント | サービス関数、ユーティリティ、フック |
| 何をテスト | 入力 → 出力の契約 | 内部ロジック、分岐、エッジケース |
| モック | DB・外部サービスのみ | 基本的にモックしない |
| 粒度 | 統合的（HTTP → DB → Response） | 関数単位 |

### テストケースの命名規約

```python
# バックエンド: test_{機能}_{条件}_{期待結果} 形式の日本語説明
async def test_create_product_success(self, ...):
    """正常な製品データで201が返る"""

async def test_create_product_duplicate_code(self, ...):
    """重複する製品コードで409が返る"""
```

```typescript
// フロントエンド: 日本語で「〜が〜される」形式
it('製品一覧が表示される', async () => { ... })
it('エラー時にエラーメッセージが表示される', async () => { ... })
```

### 最低限テストすべきパターン

| カテゴリ | テストパターン |
|---------|-------------|
| 正常系 | 有効なデータで CRUD が動作する |
| バリデーション | 必須フィールド欠落、型不一致、範囲外の値 |
| 認証 | 未認証アクセス → 401、権限不足 → 403 |
| 一意制約 | 重複キーで 409 |
| 存在チェック | 存在しない ID で 404 |
| 空データ | コレクション空の状態で一覧取得 → 空リスト |
| UI 状態遷移 | ローディング → データ表示、ローディング → エラー |

## チェックリスト

- [ ] テスト依存パッケージがインストール済み
- [ ] conftest.py / vitest.config.ts のセットアップ完了
- [ ] バックエンドの全 API にブラックボックステストがある
- [ ] サービス層にホワイトボックステストがある
- [ ] フロントエンドの全ページコンポーネントにテストがある
- [ ] カスタムフックにテストがある
- [ ] 認証・認可のテストがある (401, 403)
- [ ] 全テストが通る
- [ ] 批判的レビューを1回以上実施済み

## トラブルシューティング

| 症状 | 原因 | 対応 |
|------|------|------|
| `pytest` で `async` テストが動かない | `asyncio_mode` 未設定 | `pyproject.toml` に `asyncio_mode = "auto"` を追加 |
| `mongomock_motor` が見つからない | 未インストール | `uv add --dev mongomock-motor` |
| Vitest で JSX がパースエラー | 環境設定不足 | `vitest.config.ts` に `environment: 'jsdom'` を設定 |
| `@testing-library/jest-dom` の型エラー | 型定義不足 | `src/test-setup.ts` に import を追加 |
| テスト間でデータが残る | DB クリーンアップ不足 | `conftest.py` で各テスト前に DB をリセット |
| `fetch` が undefined | テスト環境に fetch がない | `vi.stubGlobal('fetch', mockFetch)` でモック |
| `sessionStorage` が undefined | jsdom 環境未設定 | vitest.config.ts で `environment: 'jsdom'` を確認 |
| モック呼び出し回数がずれる | `beforeEach` で `clearAllMocks` 漏れ | 各 describe/test の前に `vi.clearAllMocks()` を追加 |
