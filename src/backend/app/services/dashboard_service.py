"""ダッシュボードのビジネスロジック・集計クエリ。"""

from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

USE_CASE_LABELS: dict[str, str] = {
    "sales_ops": "営業支援",
    "customer_support": "カスタマーサポート",
    "analytics": "分析",
    "integration": "システム連携",
    "other": "その他",
}


async def _get_customer_ids_for_user(
    db: AsyncIOMotorDatabase, user: dict
) -> list[ObjectId] | None:
    """営業ユーザーの場合、担当顧客IDリストを返す。管理者はNone（全件）。"""
    if user.get("role") == "admin":
        return None
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    cursor = db["customers"].find(
        {"assigned_sales_user_id": str(user_id), "is_active": True},
        {"_id": 1},
    )
    customers = await cursor.to_list(length=1000)
    return [c["_id"] for c in customers]


async def get_usage_summary(db: AsyncIOMotorDatabase, user: dict) -> list[dict]:
    """顧客×製品ごとの最新月の利用量サマリーを取得する。"""
    customer_ids = await _get_customer_ids_for_user(db, user)

    match_stage: dict = {}
    if customer_ids is not None:
        match_stage["customer_id"] = {"$in": [str(cid) for cid in customer_ids]}

    # 最新の billing_month を顧客×製品ごとに取得し、メトリクスを集約
    pipeline: list[dict] = []
    if match_stage:
        pipeline.append({"$match": match_stage})

    pipeline.extend(
        [
            {"$sort": {"billing_month": -1}},
            {
                "$group": {
                    "_id": {
                        "customer_id": "$customer_id",
                        "product_id": "$product_id",
                        "billing_month": "$billing_month",
                    },
                    "metrics": {
                        "$push": {
                            "metric_code": "$metric_code",
                            "actual_value": "$actual_value",
                            "limit_value": "$limit_value_snapshot",
                            "usage_rate": "$usage_rate",
                            "overage_fee": "$overage_fee",
                        }
                    },
                }
            },
            {"$sort": {"_id.billing_month": -1}},
            {
                "$group": {
                    "_id": {
                        "customer_id": "$_id.customer_id",
                        "product_id": "$_id.product_id",
                    },
                    "billing_month": {"$first": "$_id.billing_month"},
                    "metrics": {"$first": "$metrics"},
                }
            },
        ]
    )

    raw_results = await db["monthly_usage"].aggregate(pipeline).to_list(length=1000)

    # 関連ドキュメントをまとめて取得
    customer_ids_set = {r["_id"]["customer_id"] for r in raw_results}
    product_ids_set = {r["_id"]["product_id"] for r in raw_results}

    customers_map: dict[str, str] = {}
    if customer_ids_set:
        cursor = db["customers"].find(
            {"_id": {"$in": [ObjectId(cid) for cid in customer_ids_set]}},
            {"customer_name": 1},
        )
        async for doc in cursor:
            customers_map[str(doc["_id"])] = doc["customer_name"]

    products_map: dict[str, str] = {}
    if product_ids_set:
        cursor = db["products"].find(
            {"_id": {"$in": [ObjectId(pid) for pid in product_ids_set]}},
            {"product_name": 1},
        )
        async for doc in cursor:
            products_map[str(doc["_id"])] = doc["product_name"]

    # 契約からプラン情報を取得
    plan_info: dict[str, dict] = {}
    if customer_ids_set and product_ids_set:
        cursor = db["contracts"].find(
            {
                "customer_id": {"$in": list(customer_ids_set)},
                "product_id": {"$in": list(product_ids_set)},
                "status": {"$in": ["active", "renewing"]},
            },
            {"customer_id": 1, "product_id": 1, "current_plan_id": 1},
        )
        async for doc in cursor:
            key = f"{doc['customer_id']}_{doc['product_id']}"
            plan_info[key] = {"plan_id": doc["current_plan_id"]}

    plan_ids_set = {v["plan_id"] for v in plan_info.values()}
    plans_map: dict[str, dict] = {}
    if plan_ids_set:
        cursor = db["plans"].find(
            {"_id": {"$in": [ObjectId(pid) for pid in plan_ids_set]}},
            {"plan_name": 1, "alert_threshold_pct": 1},
        )
        async for doc in cursor:
            plans_map[str(doc["_id"])] = {
                "plan_name": doc["plan_name"],
                "alert_threshold_pct": doc.get("alert_threshold_pct", 90),
            }

    results: list[dict] = []
    for r in raw_results:
        cid = r["_id"]["customer_id"]
        pid = r["_id"]["product_id"]
        key = f"{cid}_{pid}"
        pi = plan_info.get(key, {})
        plan_data = plans_map.get(pi.get("plan_id", ""), {})
        threshold = plan_data.get("alert_threshold_pct", 90)

        metrics = r["metrics"]
        has_alert = any(m["usage_rate"] >= threshold for m in metrics)

        results.append(
            {
                "customer_id": cid,
                "customer_name": customers_map.get(cid, ""),
                "product_id": pid,
                "product_name": products_map.get(pid, ""),
                "plan_name": plan_data.get("plan_name", ""),
                "billing_month": r["billing_month"],
                "metrics": metrics,
                "alert_threshold_pct": threshold,
                "has_alert": has_alert,
            }
        )

    results.sort(key=lambda x: (not x["has_alert"], x["customer_name"]))
    return results


async def get_alerts(db: AsyncIOMotorDatabase, user: dict) -> list[dict]:
    """閾値を超過している利用量アラートを取得する。"""
    summaries = await get_usage_summary(db, user)

    alerts: list[dict] = []
    for s in summaries:
        for m in s["metrics"]:
            if m["usage_rate"] >= s["alert_threshold_pct"]:
                alerts.append(
                    {
                        "customer_name": s["customer_name"],
                        "product_name": s["product_name"],
                        "metric_code": m["metric_code"],
                        "billing_month": s["billing_month"],
                        "usage_rate": m["usage_rate"],
                        "limit_value": m["limit_value"],
                        "actual_value": m["actual_value"],
                        "alert_threshold_pct": s["alert_threshold_pct"],
                    }
                )

    alerts.sort(key=lambda x: -x["usage_rate"])
    return alerts


async def get_trend(
    db: AsyncIOMotorDatabase,
    customer_id: str,
    product_id: str,
    metric_code: str | None = None,
) -> list[dict]:
    """指定顧客×製品の直近12ヶ月トレンドを取得する。"""
    now = datetime.now(timezone.utc)
    months: list[str] = []
    for i in range(11, -1, -1):
        dt = now - relativedelta(months=i)
        months.append(dt.strftime("%Y-%m"))

    query: dict = {
        "customer_id": customer_id,
        "product_id": product_id,
        "billing_month": {"$in": months},
    }
    if metric_code:
        query["metric_code"] = metric_code

    cursor = db["monthly_usage"].find(query).sort("billing_month", 1)
    raw = await cursor.to_list(length=5000)

    # メトリクスコード一覧を収集
    metric_codes: set[str] = set()
    if metric_code:
        metric_codes.add(metric_code)
    else:
        for r in raw:
            metric_codes.add(r["metric_code"])

    # 既存データをマップ化
    data_map: dict[str, dict] = {}
    for r in raw:
        key = f"{r['billing_month']}_{r['metric_code']}"
        data_map[key] = {
            "billing_month": r["billing_month"],
            "metric_code": r["metric_code"],
            "actual_value": r["actual_value"],
            "limit_value": r["limit_value_snapshot"],
            "usage_rate": r["usage_rate"],
        }

    # 欠損月を補完
    results: list[dict] = []
    for month in months:
        for mc in sorted(metric_codes):
            key = f"{month}_{mc}"
            if key in data_map:
                results.append(data_map[key])
            else:
                results.append(
                    {
                        "billing_month": month,
                        "metric_code": mc,
                        "actual_value": None,
                        "limit_value": None,
                        "usage_rate": None,
                    }
                )

    return results


async def get_use_case_summary(db: AsyncIOMotorDatabase, user: dict) -> list[dict]:
    """利用目的別の契約件数を集計する。"""
    customer_ids = await _get_customer_ids_for_user(db, user)

    match_stage: dict = {"status": {"$in": ["active", "renewing"]}}
    if customer_ids is not None:
        match_stage["customer_id"] = {"$in": [str(cid) for cid in customer_ids]}

    pipeline = [
        {"$match": match_stage},
        {
            "$group": {
                "_id": "$primary_use_case",
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
    ]

    raw = await db["contracts"].aggregate(pipeline).to_list(length=100)

    results: list[dict] = []
    for r in raw:
        uc = r["_id"] or "other"
        results.append(
            {
                "use_case": uc,
                "count": r["count"],
                "label": USE_CASE_LABELS.get(uc, uc),
            }
        )

    return results


async def get_last_updated(db: AsyncIOMotorDatabase) -> datetime | None:
    """最終取込確定日時を取得する。"""
    cursor = (
        db["usage_imports"]
        .find({"confirmed_at": {"$ne": None}})
        .sort("confirmed_at", -1)
        .limit(1)
    )
    docs = await cursor.to_list(length=1)
    if docs:
        return docs[0]["confirmed_at"]
    return None
