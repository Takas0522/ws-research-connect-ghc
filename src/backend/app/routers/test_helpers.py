"""テスト用ヘルパーエンドポイント。ENVIRONMENT=test でのみ有効。"""

import os
import random
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import hash_password

router = APIRouter(prefix="/api/test", tags=["test"])

PORTAL_COLLECTIONS = [
    "portal_tenants",
    "portal_users",
    "portal_subscriptions",
    "portal_usage_metrics",
]


def _check_test_environment() -> None:
    """テスト環境でない場合は 403 を返す。"""
    env = os.environ.get("ENVIRONMENT", "")
    if env != "test":
        raise HTTPException(
            status_code=403,
            detail="テストエンドポイントはテスト環境でのみ利用可能です (ENVIRONMENT=test)",
        )


class SeedUser(BaseModel):
    """シードデータ用ユーザー。"""

    email: str
    password: str
    display_name: str
    role: str = "member"


class SeedSubscription(BaseModel):
    """シードデータ用サブスクリプション。"""

    service_code: str
    service_name: str
    plan_name: str
    status: str = "active"
    base_price: float = 0
    metric_name: str = ""
    free_tier_limit: int = 0
    overage_unit_price: float = 0


class SeedTenant(BaseModel):
    """シードデータ用テナント。"""

    tenant_code: str
    tenant_name: str
    plan_tier: str = "enterprise"
    status: str = "active"


class SeedRequest(BaseModel):
    """シードデータ投入リクエスト。"""

    tenant: SeedTenant
    users: list[SeedUser] = Field(default_factory=list)
    subscriptions: list[SeedSubscription] = Field(default_factory=list)
    usage_months: int = 3


@router.post("/reset")
async def reset_test_data() -> dict[str, Any]:
    """全ポータルコレクションのデータを削除する。"""
    _check_test_environment()
    db = get_database()
    cleared: list[str] = []
    for col_name in PORTAL_COLLECTIONS:
        await db[col_name].delete_many({})
        cleared.append(col_name)
    return {"status": "ok", "cleared": cleared}


@router.post("/seed")
async def seed_test_data(req: SeedRequest) -> dict[str, Any]:
    """テストデータを投入する。"""
    _check_test_environment()
    db = get_database()
    now = datetime.now(timezone.utc)

    # 1. Create tenant
    tenant_doc = {
        "tenant_code": req.tenant.tenant_code,
        "tenant_name": req.tenant.tenant_name,
        "plan_tier": req.tenant.plan_tier,
        "status": req.tenant.status,
        "subscribed_services": [s.service_code for s in req.subscriptions],
        "created_at": now,
        "updated_at": now,
    }
    tenant_result = await db["portal_tenants"].insert_one(tenant_doc)
    tenant_id = tenant_result.inserted_id

    # 2. Create users
    user_ids: list[str] = []
    for user in req.users:
        user_doc = {
            "tenant_id": tenant_id,
            "email": user.email,
            "hashed_password": hash_password(user.password),
            "display_name": user.display_name,
            "role": user.role,
            "is_active": True,
            "last_login_at": None,
            "created_at": now,
            "updated_at": now,
        }
        result = await db["portal_users"].insert_one(user_doc)
        user_ids.append(str(result.inserted_id))

    # 3. Create subscriptions
    subscription_ids: list[tuple[str, SeedSubscription]] = []
    for sub in req.subscriptions:
        sub_doc = {
            "tenant_id": tenant_id,
            "service_code": sub.service_code,
            "service_name": sub.service_name,
            "plan_name": sub.plan_name,
            "status": sub.status,
            "base_price": sub.base_price,
            "metric_name": sub.metric_name,
            "free_tier_limit": sub.free_tier_limit,
            "overage_unit_price": sub.overage_unit_price,
            "contract_start_date": now,
            "contract_end_date": None,
            "created_at": now,
            "updated_at": now,
        }
        result = await db["portal_subscriptions"].insert_one(sub_doc)
        subscription_ids.append((str(result.inserted_id), sub))

    # 4. Create usage metrics for each subscription
    for sub_id_str, sub_info in subscription_ids:
        sub_oid = ObjectId(sub_id_str)
        for month_offset in range(req.usage_months):
            month = now.month - month_offset
            year = now.year
            while month <= 0:
                month += 12
                year -= 1
            year_month = f"{year}-{month:02d}"

            if sub_info.free_tier_limit > 0:
                quantity = random.randint(  # noqa: S311
                    int(sub_info.free_tier_limit * 0.5),
                    int(sub_info.free_tier_limit * 1.2),
                )
                usage_rate = round((quantity / sub_info.free_tier_limit) * 100, 1)
            else:
                quantity = 0
                usage_rate = 0.0

            overage = max(0, quantity - sub_info.free_tier_limit)
            billed_amount = sub_info.base_price + (
                overage * sub_info.overage_unit_price
            )

            usage_doc = {
                "tenant_id": tenant_id,
                "subscription_id": sub_oid,
                "service_code": sub_info.service_code,
                "year_month": year_month,
                "metric_name": sub_info.metric_name,
                "quantity": quantity,
                "usage_rate": usage_rate,
                "billed_amount": billed_amount,
                "primary_use_case": "E2Eテスト用途",
                "recorded_at": now,
            }
            await db["portal_usage_metrics"].insert_one(usage_doc)

    return {
        "status": "ok",
        "tenant_id": str(tenant_id),
        "user_ids": user_ids,
    }
