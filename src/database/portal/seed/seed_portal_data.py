"""ポータルアプリ用シードデータ投入スクリプト。

PoC 検証用のテナント・ユーザー・契約・利用実績データを MongoDB に投入する。
冪等性を持ち、既にデータが存在する場合はスキップする。

Usage:
    cd src/backend && uv run python ../database/portal/seed/seed_portal_data.py
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone

import bcrypt
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

# ---------- 設定 ----------
MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "saas_management"

NOW = datetime.now(timezone.utc)


def _hash(password: str) -> str:
    """パスワードを bcrypt でハッシュ化する。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _dt(y: int, m: int, d: int) -> datetime:
    """UTC タイムスタンプを生成する。"""
    return datetime(y, m, d, tzinfo=timezone.utc)


# ---------- シードデータ定義 ----------

TENANT_ID = ObjectId()

TENANT = {
    "_id": TENANT_ID,
    "tenant_code": "TENANT_ALPHA",
    "tenant_name": "アルファ株式会社",
    "contact_email": "contact@alpha.example.com",
    "plan_tier": "enterprise",
    "status": "active",
    "subscribed_services": ["CONNECT_CHAT", "CONNECT_MEET", "CONNECT_STORE"],
    "created_at": _dt(2025, 1, 15),
    "updated_at": NOW,
}

USERS = [
    {
        "_id": ObjectId(),
        "tenant_id": TENANT_ID,
        "email": "admin@alpha.example.com",
        "hashed_password": _hash("Password123!"),
        "display_name": "田中太郎",
        "role": "admin",
        "is_active": True,
        "last_login_at": NOW,
        "created_at": _dt(2025, 1, 15),
        "updated_at": NOW,
    },
    {
        "_id": ObjectId(),
        "tenant_id": TENANT_ID,
        "email": "member@alpha.example.com",
        "hashed_password": _hash("Password123!"),
        "display_name": "佐藤花子",
        "role": "member",
        "is_active": True,
        "last_login_at": None,
        "created_at": _dt(2025, 2, 1),
        "updated_at": NOW,
    },
]

# サブスクリプション定義
SUBSCRIPTION_DEFS = [
    {
        "service_code": "CONNECT_CHAT",
        "service_name": "ConnectChat",
        "plan_name": "Enterprise",
        "base_price": 50000,
        "metric_name": "messages",
        "free_tier_limit": 10000,
        "overage_unit_price": 5,
        "contract_start_date": _dt(2025, 4, 1),
    },
    {
        "service_code": "CONNECT_MEET",
        "service_name": "ConnectMeet",
        "plan_name": "Pro",
        "base_price": 30000,
        "metric_name": "minutes",
        "free_tier_limit": 5000,
        "overage_unit_price": 10,
        "contract_start_date": _dt(2025, 4, 1),
    },
    {
        "service_code": "CONNECT_STORE",
        "service_name": "ConnectStore",
        "plan_name": "Standard",
        "base_price": 20000,
        "metric_name": "storage_gb",
        "free_tier_limit": 100,
        "overage_unit_price": 200,
        "contract_start_date": _dt(2025, 4, 1),
    },
]

USE_CASES = [
    "社内コミュニケーション",
    "顧客対応",
    "プロジェクト管理",
    "情報共有",
    None,
]

# 12 か月分 (2025-04 ~ 2026-03)
YEAR_MONTHS = [f"{2025 + (m // 13):04d}-{((m - 1) % 12) + 1:02d}" for m in range(4, 16)]


def _build_subscriptions() -> list[dict]:
    """サブスクリプションドキュメントを構築する。"""
    subscriptions = []
    for defn in SUBSCRIPTION_DEFS:
        subscriptions.append(
            {
                "_id": ObjectId(),
                "tenant_id": TENANT_ID,
                "service_code": defn["service_code"],
                "service_name": defn["service_name"],
                "plan_name": defn["plan_name"],
                "status": "active",
                "base_price": defn["base_price"],
                "metric_name": defn["metric_name"],
                "free_tier_limit": defn["free_tier_limit"],
                "overage_unit_price": defn["overage_unit_price"],
                "contract_start_date": defn["contract_start_date"],
                "contract_end_date": None,
                "created_at": defn["contract_start_date"],
                "updated_at": NOW,
            }
        )
    return subscriptions


def _build_usage_metrics(subscriptions: list[dict]) -> list[dict]:
    """月次利用実績データを構築する。50-120% の範囲で quantity を変動させる。"""
    random.seed(42)  # 再現性のためシード固定
    metrics = []

    for sub in subscriptions:
        free_tier = sub["free_tier_limit"]
        for ym in YEAR_MONTHS:
            # 50-120% の範囲で変動
            ratio = random.uniform(0.5, 1.2)
            quantity = int(free_tier * ratio)
            usage_rate = round(quantity / free_tier * 100, 1)
            overage = max(0, quantity - free_tier)
            billed_amount = sub["base_price"] + overage * sub["overage_unit_price"]

            year, month = map(int, ym.split("-"))
            recorded_at = datetime(year, month, 28, 12, 0, 0, tzinfo=timezone.utc)

            metrics.append(
                {
                    "_id": ObjectId(),
                    "tenant_id": TENANT_ID,
                    "subscription_id": sub["_id"],
                    "service_code": sub["service_code"],
                    "year_month": ym,
                    "metric_name": sub["metric_name"],
                    "quantity": quantity,
                    "usage_rate": usage_rate,
                    "billed_amount": billed_amount,
                    "primary_use_case": random.choice(USE_CASES),
                    "recorded_at": recorded_at,
                }
            )

    return metrics


async def seed() -> None:
    """ポータル用シードデータを MongoDB に投入する。"""
    client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URI)
    db = client[DATABASE_NAME]

    try:
        # 冪等チェック
        if await db.portal_tenants.count_documents({}) > 0:
            print("ポータルシードデータは既に投入済みです。スキップします。")
            return

        # テナント
        await db.portal_tenants.insert_one(TENANT)
        print(f"  portal_tenants: 1 件投入")

        # ユーザー
        await db.portal_users.insert_many(USERS)
        print(f"  portal_users: {len(USERS)} 件投入")

        # サブスクリプション
        subscriptions = _build_subscriptions()
        await db.portal_subscriptions.insert_many(subscriptions)
        print(f"  portal_subscriptions: {len(subscriptions)} 件投入")

        # 利用実績
        usage_metrics = _build_usage_metrics(subscriptions)
        await db.portal_usage_metrics.insert_many(usage_metrics)
        print(f"  portal_usage_metrics: {len(usage_metrics)} 件投入")

        print("ポータルシードデータの投入が完了しました。")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed())
