"""ポータルダッシュボードのビジネスロジック・集計クエリ。"""

from datetime import datetime, timezone

from bson import ObjectId
from dateutil.relativedelta import relativedelta
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_dashboard_summary(db: AsyncIOMotorDatabase, tenant_id: str) -> dict:
    """テナントの最新月の利用状況サマリーを集計する。

    Args:
        db: MongoDB データベースインスタンス。
        tenant_id: テナント ID。

    Returns:
        DashboardSummaryResponse に対応するデータ。
    """
    tenant_oid = ObjectId(tenant_id)

    # テナント情報を取得
    tenant = await db["portal_tenants"].find_one({"_id": tenant_oid})
    tenant_name = tenant["tenant_name"] if tenant else ""

    # 最新の year_month を取得
    latest_doc = (
        await db["portal_usage_metrics"]
        .find({"tenant_id": tenant_oid})
        .sort("year_month", -1)
        .limit(1)
        .to_list(length=1)
    )

    if not latest_doc:
        return {
            "tenant_name": tenant_name,
            "total_services": 0,
            "total_billed_amount": 0.0,
            "services": [],
        }

    latest_month = latest_doc[0]["year_month"]

    # 前月を算出
    latest_dt = datetime.strptime(latest_month, "%Y-%m").replace(tzinfo=timezone.utc)
    prev_dt = latest_dt - relativedelta(months=1)
    prev_month = prev_dt.strftime("%Y-%m")

    # 最新月のメトリクスを取得
    current_metrics = (
        await db["portal_usage_metrics"]
        .find({"tenant_id": tenant_oid, "year_month": latest_month})
        .to_list(length=1000)
    )

    # 前月のメトリクスを取得
    prev_metrics_raw = (
        await db["portal_usage_metrics"]
        .find({"tenant_id": tenant_oid, "year_month": prev_month})
        .to_list(length=1000)
    )

    # 前月データを service_code でマップ化
    prev_map: dict[str, dict] = {}
    for pm in prev_metrics_raw:
        prev_map[pm["service_code"]] = pm

    # サブスクリプション情報を取得して service_code でマップ化
    subscriptions = (
        await db["portal_subscriptions"]
        .find({"tenant_id": tenant_oid})
        .to_list(length=1000)
    )

    sub_map: dict[str, dict] = {}
    for sub in subscriptions:
        sub_map[sub["service_code"]] = sub

    # サービス別サマリーを構築
    services: list[dict] = []
    total_billed = 0.0

    for metric in current_metrics:
        sc = metric["service_code"]
        sub = sub_map.get(sc, {})

        # 前月比を算出
        mom_change: float | None = None
        prev = prev_map.get(sc)
        if prev and prev["quantity"] > 0:
            mom_change = round(
                (metric["quantity"] - prev["quantity"]) / prev["quantity"] * 100, 1
            )

        billed = metric.get("billed_amount", 0.0)
        total_billed += billed

        services.append(
            {
                "service_code": sc,
                "service_name": sub.get("service_name", sc),
                "plan_name": sub.get("plan_name", ""),
                "metric_name": metric.get("metric_name", ""),
                "quantity": metric.get("quantity", 0),
                "free_tier_limit": sub.get("free_tier_limit", 0),
                "usage_rate": metric.get("usage_rate", 0.0),
                "billed_amount": billed,
                "mom_change": mom_change,
            }
        )

    return {
        "tenant_name": tenant_name,
        "total_services": len(services),
        "total_billed_amount": round(total_billed, 2),
        "services": services,
    }


async def get_usage_trends(
    db: AsyncIOMotorDatabase, tenant_id: str, months: int = 12
) -> dict:
    """過去 N ヶ月の月次利用推移データを取得する。

    Args:
        db: MongoDB データベースインスタンス。
        tenant_id: テナント ID。
        months: 取得する月数（デフォルト 12）。

    Returns:
        UsageTrendResponse に対応するデータ。
    """
    tenant_oid = ObjectId(tenant_id)

    now = datetime.now(timezone.utc)
    month_list: list[str] = []
    for i in range(months - 1, -1, -1):
        dt = now - relativedelta(months=i)
        month_list.append(dt.strftime("%Y-%m"))

    period_start = month_list[0]
    period_end = month_list[-1]

    # 該当期間のメトリクスを取得
    cursor = (
        db["portal_usage_metrics"]
        .find(
            {
                "tenant_id": tenant_oid,
                "year_month": {"$in": month_list},
            }
        )
        .sort("year_month", 1)
    )
    raw_metrics = await cursor.to_list(length=10000)

    # サブスクリプション情報を取得して service_code → service_name のマップを作成
    subscriptions = (
        await db["portal_subscriptions"]
        .find({"tenant_id": tenant_oid})
        .to_list(length=1000)
    )

    svc_name_map: dict[str, str] = {}
    for sub in subscriptions:
        svc_name_map[sub["service_code"]] = sub.get("service_name", sub["service_code"])

    trends: list[dict] = []
    for metric in raw_metrics:
        sc = metric["service_code"]
        trends.append(
            {
                "year_month": metric["year_month"],
                "service_code": sc,
                "service_name": svc_name_map.get(sc, sc),
                "quantity": metric.get("quantity", 0),
                "billed_amount": metric.get("billed_amount", 0.0),
            }
        )

    return {
        "trends": trends,
        "period_start": period_start,
        "period_end": period_end,
    }


async def get_usage_by_purpose(db: AsyncIOMotorDatabase, tenant_id: str) -> dict:
    """利用目的（primary_use_case）別の集計を行う。

    Args:
        db: MongoDB データベースインスタンス。
        tenant_id: テナント ID。

    Returns:
        UsageByPurposeResponse に対応するデータ。
    """
    tenant_oid = ObjectId(tenant_id)

    pipeline = [
        {"$match": {"tenant_id": tenant_oid}},
        {
            "$group": {
                "_id": "$primary_use_case",
                "count": {"$sum": 1},
                "total_quantity": {"$sum": "$quantity"},
            }
        },
        {"$sort": {"total_quantity": -1}},
    ]

    raw = await db["portal_usage_metrics"].aggregate(pipeline).to_list(length=1000)

    purposes: list[dict] = []
    for r in raw:
        use_case = r["_id"] if r["_id"] else "その他"
        purposes.append(
            {
                "primary_use_case": use_case,
                "count": r["count"],
                "total_quantity": r["total_quantity"],
            }
        )

    return {"purposes": purposes}
