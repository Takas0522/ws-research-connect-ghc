"""ポータル契約サービス・利用詳細のビジネスロジック。"""

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_subscriptions(db: AsyncIOMotorDatabase, tenant_id: str) -> dict:
    """テナントの契約サービス一覧を取得する。

    Args:
        db: MongoDB データベース。
        tenant_id: テナント ID。

    Returns:
        契約サービス一覧データ。
    """
    cursor = db["portal_subscriptions"].find({"tenant_id": ObjectId(tenant_id)})
    docs = await cursor.to_list(length=1000)

    subscriptions = []
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        doc["tenant_id"] = str(doc["tenant_id"])
        subscriptions.append(doc)

    return {
        "subscriptions": subscriptions,
        "total_count": len(subscriptions),
    }


async def get_service_usage(
    db: AsyncIOMotorDatabase, tenant_id: str, service_code: str
) -> dict:
    """サービス別の月次利用詳細を取得する。

    Args:
        db: MongoDB データベース。
        tenant_id: テナント ID。
        service_code: サービスコード。

    Returns:
        サービス別利用詳細データ。

    Raises:
        HTTPException: 契約が見つからない場合。
    """
    subscription = await db["portal_subscriptions"].find_one(
        {"tenant_id": ObjectId(tenant_id), "service_code": service_code}
    )
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="契約が見つかりません",
        )

    cursor = (
        db["portal_usage_metrics"]
        .find({"tenant_id": ObjectId(tenant_id), "service_code": service_code})
        .sort("year_month", -1)
    )
    metrics = await cursor.to_list(length=1000)

    usage_details = []
    for m in metrics:
        usage_details.append(
            {
                "year_month": m["year_month"],
                "metric_name": m["metric_name"],
                "quantity": m["quantity"],
                "usage_rate": m["usage_rate"],
                "billed_amount": m["billed_amount"],
                "primary_use_case": m.get("primary_use_case"),
            }
        )

    return {
        "service_code": subscription["service_code"],
        "service_name": subscription["service_name"],
        "plan_name": subscription["plan_name"],
        "free_tier_limit": subscription.get("free_tier_limit", 0),
        "overage_unit_price": subscription.get("overage_unit_price", 0.0),
        "usage_details": usage_details,
    }
