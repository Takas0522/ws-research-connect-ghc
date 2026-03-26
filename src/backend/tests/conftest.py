"""テスト共通フィクスチャ。

テスト用 MongoDB データベースと認証済み HTTP クライアントを提供する。
"""

from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.core.security import create_access_token, hash_password

TEST_DATABASE_NAME = "saas_management_test"

_test_client: AsyncIOMotorClient | None = None


def _get_test_database():
    """テスト用データベースインスタンスを返す。"""
    if _test_client is None:
        raise RuntimeError("Test database client is not initialized.")
    return _test_client[TEST_DATABASE_NAME]


@pytest.fixture(scope="session")
def anyio_backend():
    """anyio バックエンド指定。"""
    return "asyncio"


@pytest.fixture(scope="session", autouse=True)
async def _setup_test_db():
    """セッション全体でテスト用 MongoDB クライアントを管理する。"""
    global _test_client
    _test_client = AsyncIOMotorClient(settings.MONGO_URI)
    db = _test_client[TEST_DATABASE_NAME]

    # ユニークインデックスを作成（本番の init スクリプトと同等）
    await db["users"].create_index("email", unique=True)
    await db["products"].create_index("product_code", unique=True)
    await db["metrics_definitions"].create_index(
        [("product_id", 1), ("metric_code", 1)], unique=True
    )
    await db["plans"].create_index(
        [("product_id", 1), ("plan_code", 1)], unique=True
    )
    await db["customers"].create_index("customer_code", unique=True)
    await db["monthly_usage"].create_index(
        [("contract_id", 1), ("billing_month", 1), ("metric_code", 1)], unique=True
    )

    yield
    # テスト DB を削除してクリーンアップ
    if _test_client is not None:
        await _test_client.drop_database(TEST_DATABASE_NAME)
        _test_client.close()
        _test_client = None


@pytest.fixture()
async def test_db():
    """テスト用 Motor データベースを返す。各テスト前に全コレクションをクリアする。"""
    db = _get_test_database()
    collections = await db.list_collection_names()
    for col in collections:
        await db[col].delete_many({})
    return db


@pytest.fixture()
async def test_client(test_db):
    """テスト用 httpx AsyncClient を返す。

    database モジュールの内部クライアントをテスト用に差し替え、
    全ての get_database() 呼び出しがテスト用 DB を返すようにする。
    """
    import app.core.database as db_module
    from main import app

    original_client = db_module._client
    original_db_name = settings.DATABASE_NAME

    db_module._client = _test_client
    settings.DATABASE_NAME = TEST_DATABASE_NAME  # type: ignore[misc]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    db_module._client = original_client
    settings.DATABASE_NAME = original_db_name  # type: ignore[misc]


async def _create_test_user(db, email: str, role: str, display_name: str) -> dict:
    """テスト用ユーザーを作成する。"""
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": hash_password("testpassword"),
        "display_name": display_name,
        "role": role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return user_doc


@pytest.fixture()
async def admin_token(test_db) -> str:
    """管理者ユーザーの JWT トークンを返す。"""
    user = await _create_test_user(
        test_db,
        email="admin@test.example.com",
        role="admin",
        display_name="テスト管理者",
    )
    return create_access_token({"sub": user["email"]})


@pytest.fixture()
async def sales_token(test_db) -> str:
    """営業ユーザーの JWT トークンを返す。"""
    user = await _create_test_user(
        test_db,
        email="sales@test.example.com",
        role="sales",
        display_name="テスト営業",
    )
    return create_access_token({"sub": user["email"]})
