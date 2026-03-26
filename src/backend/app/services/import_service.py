"""従量データ取込サービス — CSV アップロード・検証・確定。"""

import csv
import hashlib
import io
import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.audit_service import create_audit_log

USAGE_IMPORTS_COLLECTION = "usage_imports"
MONTHLY_USAGE_COLLECTION = "monthly_usage"
CUSTOMERS_COLLECTION = "customers"
PRODUCTS_COLLECTION = "products"
CONTRACTS_COLLECTION = "contracts"
PLANS_COLLECTION = "plans"

REQUIRED_HEADERS = [
    "customer_code",
    "product_code",
    "billing_month",
    "metric_code",
    "actual_value",
]

BILLING_MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


async def upload_and_validate(
    db: AsyncIOMotorDatabase,
    file: UploadFile,
    current_user: dict,
) -> dict:
    """CSV をアップロードし検証結果のプレビューを返す。

    Args:
        db: MongoDB データベースインスタンス。
        file: アップロードされた CSV ファイル。
        current_user: 現在のユーザー。

    Returns:
        プレビューレスポンス用の辞書。
    """
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSVファイルのエンコーディングが不正です。UTF-8で保存してください。",
        )

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSVファイルが空です。",
        )

    # ヘッダー検証
    missing_headers = [h for h in REQUIRED_HEADERS if h not in reader.fieldnames]
    if missing_headers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"必須ヘッダーが不足しています: {', '.join(missing_headers)}",
        )

    rows = list(reader)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSVファイルにデータ行がありません。",
        )

    # billing_month の一貫性チェック（全行同一であることを期待）
    billing_months = {row.get("billing_month", "").strip() for row in rows}
    billing_months_valid = {
        bm for bm in billing_months if BILLING_MONTH_PATTERN.match(bm)
    }
    if len(billing_months_valid) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="有効な billing_month がありません。YYYY-MM 形式で指定してください。",
        )
    # 最初の有効な billing_month をファイルの billing_month とする
    billing_month = sorted(billing_months_valid)[0]

    # マスターデータのキャッシュ取得
    customer_cache = await _build_customer_cache(db)
    product_cache = await _build_product_cache(db)
    contract_cache = await _build_contract_cache(db)
    plan_cache = await _build_plan_cache(db)

    preview_records: list[dict[str, Any]] = []
    error_details: list[str] = []
    error_count = 0

    for row_idx, row in enumerate(rows, start=2):
        record = _validate_row(
            row, row_idx, customer_cache, product_cache, contract_cache, plan_cache
        )
        preview_records.append(record)
        if record["status"] == "error":
            error_count += 1
            if record["error_message"]:
                error_details.append(f"行{row_idx}: {record['error_message']}")

    # replace_mode: 同一 billing_month の confirmed インポートが存在するか
    existing_confirmed = await db[USAGE_IMPORTS_COLLECTION].find_one(
        {"billing_month": billing_month, "status": "confirmed"}
    )
    replace_mode = existing_confirmed is not None

    # ステータス判定
    ok_count = sum(1 for r in preview_records if r["status"] == "ok")
    import_status = "validated" if ok_count > 0 else "failed"

    now = datetime.now(timezone.utc)
    import_doc = {
        "billing_month": billing_month,
        "source_type": "csv",
        "file_name": file.filename or "unknown.csv",
        "file_hash": file_hash,
        "replace_mode": replace_mode,
        "status": import_status,
        "uploaded_by_user_id": str(current_user["_id"]),
        "record_count": len(preview_records),
        "error_count": error_count,
        "error_details": error_details,
        "_preview_records": [r for r in preview_records if r["status"] == "ok"],
        "created_at": now,
        "confirmed_at": None,
    }
    result = await db[USAGE_IMPORTS_COLLECTION].insert_one(import_doc)
    import_id = str(result.inserted_id)

    return {
        "import_id": import_id,
        "billing_month": billing_month,
        "file_name": import_doc["file_name"],
        "record_count": len(preview_records),
        "error_count": error_count,
        "error_details": error_details,
        "records": preview_records,
        "replace_mode": replace_mode,
        "status": import_status,
    }


async def confirm_import(
    db: AsyncIOMotorDatabase,
    import_id: str,
    current_user: dict,
) -> dict:
    """検証済みインポートを確定し、monthly_usage にデータを挿入する。

    Args:
        db: MongoDB データベースインスタンス。
        import_id: 取込レコードの ObjectId 文字列。
        current_user: 現在のユーザー。

    Returns:
        更新後の取込レコード。

    Raises:
        HTTPException: 取込レコードが見つからない、またはステータスが不正な場合。
    """
    if not ObjectId.is_valid(import_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なインポートIDです",
        )

    import_doc = await db[USAGE_IMPORTS_COLLECTION].find_one(
        {"_id": ObjectId(import_id)}
    )
    if import_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="インポートレコードが見つかりません",
        )

    if import_doc["status"] != "validated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"確定できるステータスは 'validated' のみです（現在: {import_doc['status']}）",
        )

    preview_records = import_doc.get("_preview_records", [])
    if not preview_records:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="確定可能なレコードがありません",
        )

    billing_month = import_doc["billing_month"]
    now = datetime.now(timezone.utc)

    # replace_mode: 同一 billing_month の既存データを削除
    if import_doc.get("replace_mode"):
        affected_contract_ids = list(
            {r["contract_id"] for r in preview_records if r.get("contract_id")}
        )
        if affected_contract_ids:
            await db[MONTHLY_USAGE_COLLECTION].delete_many(
                {
                    "billing_month": billing_month,
                    "contract_id": {"$in": affected_contract_ids},
                }
            )

    # monthly_usage ドキュメントを作成
    usage_docs = []
    for record in preview_records:
        usage_doc = {
            "contract_id": record["contract_id"],
            "customer_id": record["customer_id"],
            "product_id": record["product_id"],
            "billing_month": billing_month,
            "metric_code": record["metric_code"],
            "actual_value": record["actual_value"],
            "limit_value_snapshot": record["limit_value_snapshot"],
            "usage_rate": record["usage_rate"],
            "overage_count": record["overage_count"],
            "overage_fee": record["overage_fee"],
            "import_id": import_id,
            "imported_at": now,
        }
        usage_docs.append(usage_doc)

    if usage_docs:
        await db[MONTHLY_USAGE_COLLECTION].insert_many(usage_docs)

    # インポートレコードを更新
    await db[USAGE_IMPORTS_COLLECTION].update_one(
        {"_id": ObjectId(import_id)},
        {
            "$set": {
                "status": "confirmed",
                "confirmed_at": now,
            },
            "$unset": {"_preview_records": ""},
        },
    )

    # 監査ログ
    await create_audit_log(
        db,
        actor_user_id=str(current_user["_id"]),
        resource_type="usage_import",
        resource_id=import_id,
        action="confirm",
        after={
            "billing_month": billing_month,
            "record_count": len(usage_docs),
            "replace_mode": import_doc.get("replace_mode", False),
        },
    )

    # 更新後のドキュメントを返す
    updated = await db[USAGE_IMPORTS_COLLECTION].find_one({"_id": ObjectId(import_id)})
    if updated:
        updated["_id"] = str(updated["_id"])
    return updated  # type: ignore[return-value]


async def get_import_history(
    db: AsyncIOMotorDatabase,
    limit: int = 50,
) -> list[dict]:
    """取込履歴を取得する。

    Args:
        db: MongoDB データベースインスタンス。
        limit: 取得件数上限。

    Returns:
        取込履歴ドキュメントのリスト。
    """
    cursor = (
        db[USAGE_IMPORTS_COLLECTION]
        .find({}, {"_preview_records": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    imports = await cursor.to_list(length=limit)
    for doc in imports:
        doc["_id"] = str(doc["_id"])
    return imports


# --- プライベートヘルパー ---


async def _build_customer_cache(
    db: AsyncIOMotorDatabase,
) -> dict[str, dict]:
    """customer_code → 顧客ドキュメントのキャッシュを構築する。"""
    cursor = db[CUSTOMERS_COLLECTION].find({"is_active": True})
    customers = await cursor.to_list(length=10000)
    return {c["customer_code"]: c for c in customers}


async def _build_product_cache(
    db: AsyncIOMotorDatabase,
) -> dict[str, dict]:
    """product_code → 製品ドキュメントのキャッシュを構築する。"""
    cursor = db[PRODUCTS_COLLECTION].find({"is_active": True})
    products = await cursor.to_list(length=10000)
    return {p["product_code"]: p for p in products}


async def _build_contract_cache(
    db: AsyncIOMotorDatabase,
) -> dict[str, dict]:
    """(customer_id, product_id) → 契約ドキュメントのキャッシュを構築する。"""
    cursor = db[CONTRACTS_COLLECTION].find({"status": "active"})
    contracts = await cursor.to_list(length=10000)
    cache: dict[str, dict] = {}
    for c in contracts:
        key = f"{c['customer_id']}_{c['product_id']}"
        cache[key] = c
    return cache


async def _build_plan_cache(
    db: AsyncIOMotorDatabase,
) -> dict[str, dict]:
    """plan_id(str) → プランドキュメントのキャッシュを構築する。"""
    cursor = db[PLANS_COLLECTION].find({})
    plans = await cursor.to_list(length=10000)
    return {str(p["_id"]): p for p in plans}


def _validate_row(
    row: dict[str, str],
    row_idx: int,
    customer_cache: dict[str, dict],
    product_cache: dict[str, dict],
    contract_cache: dict[str, dict],
    plan_cache: dict[str, dict],
) -> dict[str, Any]:
    """1 行分の CSV データを検証し、プレビューレコードを返す。"""
    customer_code = row.get("customer_code", "").strip()
    product_code = row.get("product_code", "").strip()
    billing_month = row.get("billing_month", "").strip()
    metric_code = row.get("metric_code", "").strip()
    actual_value_str = row.get("actual_value", "").strip()

    base_record: dict[str, Any] = {
        "customer_code": customer_code,
        "product_code": product_code,
        "metric_code": metric_code,
        "actual_value": 0,
        "limit_value": None,
        "usage_rate": None,
        "overage_count": None,
        "overage_fee": None,
        "status": "ok",
        "error_message": None,
    }

    errors: list[str] = []

    # billing_month 形式チェック
    if not BILLING_MONTH_PATTERN.match(billing_month):
        errors.append(f"billing_month の形式が不正です: '{billing_month}'")

    # actual_value の数値チェック
    actual_value = 0.0
    try:
        actual_value = float(actual_value_str)
        if actual_value < 0:
            errors.append(f"actual_value が負の値です: {actual_value}")
    except (ValueError, TypeError):
        errors.append(f"actual_value が数値ではありません: '{actual_value_str}'")

    base_record["actual_value"] = actual_value

    # 顧客の存在チェック
    customer = customer_cache.get(customer_code)
    if customer is None:
        errors.append(f"不明な customer_code: '{customer_code}'")

    # 製品の存在チェック
    product = product_cache.get(product_code)
    if product is None:
        errors.append(f"不明な product_code: '{product_code}'")

    # 契約の存在チェック
    contract = None
    plan = None
    if customer and product:
        customer_id = str(customer["_id"])
        product_id = str(product["_id"])
        contract_key = f"{customer_id}_{product_id}"
        contract = contract_cache.get(contract_key)
        if contract is None:
            errors.append(
                f"'{customer_code}' と '{product_code}' のアクティブな契約が見つかりません"
            )
        else:
            plan_id = contract.get("current_plan_id")
            if plan_id:
                plan = plan_cache.get(plan_id)

    # メトリクスコードの検証とリミット値の取得
    limit_value: float | None = None
    overage_unit_price: float = 0.0
    if plan:
        metric_limits = plan.get("metric_limits", [])
        matched = [ml for ml in metric_limits if ml.get("metric_code") == metric_code]
        if not matched:
            errors.append(
                f"プラン '{plan.get('plan_name', '')}' に metric_code '{metric_code}' が定義されていません"
            )
        else:
            limit_value = matched[0].get("limit_value", 0)
            overage_unit_price = matched[0].get("overage_unit_price", 0)
    elif contract and not plan:
        errors.append("契約に紐づくプランが見つかりません")

    if errors:
        base_record["status"] = "error"
        base_record["error_message"] = "; ".join(errors)
        return base_record

    # 計算
    base_record["limit_value"] = limit_value
    if limit_value and limit_value > 0:
        usage_rate = round(actual_value / limit_value * 100, 2)
        overage_count = max(0, actual_value - limit_value)
        overage_fee = round(overage_count * overage_unit_price, 2)
    else:
        usage_rate = 0.0
        overage_count = 0.0
        overage_fee = 0.0

    base_record["usage_rate"] = usage_rate
    base_record["overage_count"] = overage_count
    base_record["overage_fee"] = overage_fee

    # 確定時に使う内部データも追加（プレビューレスポンスからは除外）
    base_record["contract_id"] = str(contract["_id"])  # type: ignore[index]
    base_record["customer_id"] = str(customer["_id"])  # type: ignore[index]
    base_record["product_id"] = str(product["_id"])  # type: ignore[index]
    base_record["limit_value_snapshot"] = limit_value
    base_record["billing_month"] = billing_month

    return base_record
