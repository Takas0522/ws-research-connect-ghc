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
    await db["plans"].create_index([("product_id", 1), ("plan_code", 1)], unique=True)
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


# ====== Portal テスト用フィクスチャ ======


@pytest.fixture()
async def portal_tenant(test_db):
    """ポータルテナントを作成する。"""
    from bson import ObjectId

    tenant_id = ObjectId()
    await test_db["portal_tenants"].insert_one({
        "_id": tenant_id,
        "tenant_code": "TEST_TENANT",
        "tenant_name": "テスト企業",
        "contact_email": "contact@test.com",
        "plan_tier": "enterprise",
        "status": "active",
        "subscribed_services": ["CONNECT_CHAT", "CONNECT_MEET"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"_id": tenant_id, "tenant_code": "TEST_TENANT", "tenant_name": "テスト企業", "plan_tier": "enterprise"}


@pytest.fixture()
async def portal_admin_user(test_db, portal_tenant):
    """ポータル管理者ユーザーを作成する。"""
    from bson import ObjectId

    user_id = ObjectId()
    await test_db["portal_users"].insert_one({
        "_id": user_id,
        "tenant_id": portal_tenant["_id"],
        "email": "admin@test.example.com",
        "hashed_password": hash_password("Password123!"),
        "display_name": "テスト管理者",
        "role": "admin",
        "is_active": True,
        "last_login_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"_id": user_id, "tenant_id": portal_tenant["_id"], "email": "admin@test.example.com", "role": "admin"}


@pytest.fixture()
async def portal_member_user(test_db, portal_tenant):
    """ポータル一般ユーザーを作成する。"""
    from bson import ObjectId

    user_id = ObjectId()
    await test_db["portal_users"].insert_one({
        "_id": user_id,
        "tenant_id": portal_tenant["_id"],
        "email": "member@test.example.com",
        "hashed_password": hash_password("Password123!"),
        "display_name": "テストメンバー",
        "role": "member",
        "is_active": True,
        "last_login_at": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"_id": user_id, "tenant_id": portal_tenant["_id"], "email": "member@test.example.com", "role": "member"}


@pytest.fixture()
async def portal_admin_token(portal_admin_user, portal_tenant) -> str:
    """ポータル管理者の JWT トークンを返す。"""
    return create_access_token({
        "sub": str(portal_admin_user["_id"]),
        "tenant_id": str(portal_admin_user["tenant_id"]),
        "tenant_code": portal_tenant["tenant_code"],
        "role": "admin",
    })


@pytest.fixture()
async def portal_member_token(portal_member_user, portal_tenant) -> str:
    """ポータル一般ユーザーの JWT トークンを返す。"""
    return create_access_token({
        "sub": str(portal_member_user["_id"]),
        "tenant_id": str(portal_member_user["tenant_id"]),
        "tenant_code": portal_tenant["tenant_code"],
        "role": "member",
    })


@pytest.fixture()
async def portal_subscriptions(test_db, portal_tenant):
    """ポータルテナントの契約サービスを作成する。"""
    from bson import ObjectId

    subs = []
    for code, name, plan, price, metric, limit, overage in [
        ("CONNECT_CHAT", "ConnectChat", "Enterprise", 50000, "messages", 10000, 5),
        ("CONNECT_MEET", "ConnectMeet", "Pro", 30000, "minutes", 5000, 10),
        ("CONNECT_STORE", "ConnectStore", "Standard", 20000, "storage_gb", 100, 200),
    ]:
        sub_id = ObjectId()
        doc = {
            "_id": sub_id,
            "tenant_id": portal_tenant["_id"],
            "service_code": code,
            "service_name": name,
            "plan_name": plan,
            "status": "active",
            "base_price": price,
            "metric_name": metric,
            "free_tier_limit": limit,
            "overage_unit_price": overage,
            "contract_start_date": datetime(2025, 4, 1, tzinfo=timezone.utc),
            "contract_end_date": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        await test_db["portal_subscriptions"].insert_one(doc)
        subs.append({"_id": sub_id, "service_code": code, **doc})
    return subs


@pytest.fixture()
async def portal_usage_metrics(test_db, portal_tenant, portal_subscriptions):
    """ポータルテナントの利用実績を作成する（3サービス×3ヶ月）。"""
    from bson import ObjectId

    import random

    metrics = []
    use_cases = ["社内コミュニケーション", "顧客対応", "プロジェクト管理", None]
    for sub in portal_subscriptions:
        for ym in ["2026-01", "2026-02", "2026-03"]:
            limit = sub.get("free_tier_limit", 100)
            qty = int(limit * random.uniform(0.5, 1.2))
            rate = round(qty / limit * 100, 1)
            overage = max(0, qty - limit) * sub.get("overage_unit_price", 0)
            billed = sub.get("base_price", 0) + overage
            doc = {
                "_id": ObjectId(),
                "tenant_id": portal_tenant["_id"],
                "subscription_id": sub["_id"],
                "service_code": sub["service_code"],
                "year_month": ym,
                "metric_name": sub.get("metric_name", "units"),
                "quantity": qty,
                "usage_rate": rate,
                "billed_amount": billed,
                "primary_use_case": random.choice(use_cases),
                "recorded_at": datetime.now(timezone.utc),
            }
            await test_db["portal_usage_metrics"].insert_one(doc)
            metrics.append(doc)
    return metrics
