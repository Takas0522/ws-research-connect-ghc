"""契約サービス — 契約 CRUD 操作。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.contract import ContractCreate, ContractUpdate
from app.services.audit_service import create_audit_log

CONTRACTS_COLLECTION = "contracts"
HISTORY_COLLECTION = "contract_plan_history"
CUSTOMERS_COLLECTION = "customers"
PRODUCTS_COLLECTION = "products"
PLANS_COLLECTION = "plans"


async def _enrich_contract(db: AsyncIOMotorDatabase, contract: dict) -> dict:
    """契約に顧客名・製品名・プラン名を付与する。"""
    customer = await db[CUSTOMERS_COLLECTION].find_one(
        {"_id": ObjectId(contract["customer_id"])}
    )
    contract["customer_name"] = customer["customer_name"] if customer else None

    product = await db[PRODUCTS_COLLECTION].find_one(
        {"_id": ObjectId(contract["product_id"])}
    )
    contract["product_name"] = product["product_name"] if product else None

    plan = await db[PLANS_COLLECTION].find_one(
        {"_id": ObjectId(contract["current_plan_id"])}
    )
    contract["plan_name"] = plan["plan_name"] if plan else None

    return contract


async def _check_sales_authorization(
    db: AsyncIOMotorDatabase, customer_id: str, current_user: dict
) -> None:
    """営業ユーザーが担当顧客の契約のみ操作できることを検証する。"""
    if current_user.get("role") == "admin":
        return
    customer = await db[CUSTOMERS_COLLECTION].find_one({"_id": ObjectId(customer_id)})
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="顧客が見つかりません",
        )
    if customer.get("assigned_sales_user_id") != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この契約を操作する権限がありません",
        )


async def _create_plan_history(
    db: AsyncIOMotorDatabase,
    contract_id: str,
    plan_id: str,
    effective_from: str,
    license_count: int,
    change_reason: str,
    changed_by_user_id: str,
) -> None:
    """プラン変更履歴を作成する。既存の最新履歴に effective_to を設定する。"""
    # 既存の最新履歴を閉じる
    await db[HISTORY_COLLECTION].update_many(
        {"contract_id": contract_id, "effective_to": None},
        {"$set": {"effective_to": effective_from}},
    )

    # プラン情報を取得してスナップショットを作成
    plan = await db[PLANS_COLLECTION].find_one({"_id": ObjectId(plan_id)})
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プランが見つかりません",
        )

    now = datetime.now(timezone.utc)
    history_doc = {
        "contract_id": contract_id,
        "plan_id": plan_id,
        "effective_from": effective_from,
        "effective_to": None,
        "monthly_base_fee_snapshot": plan.get("monthly_base_fee", 0),
        "metric_limits_snapshot": plan.get("metric_limits", []),
        "license_count_snapshot": license_count,
        "change_reason": change_reason,
        "changed_by_user_id": changed_by_user_id,
        "created_at": now,
    }
    await db[HISTORY_COLLECTION].insert_one(history_doc)


async def get_contracts(
    db: AsyncIOMotorDatabase, user: dict | None = None
) -> list[dict]:
    """契約一覧を取得する。営業ユーザーは担当顧客の契約のみ取得する。

    Args:
        db: MongoDB データベースインスタンス。
        user: 現在のユーザー。

    Returns:
        契約ドキュメントのリスト。
    """
    query: dict = {}

    if user and user.get("role") == "sales":
        # 担当顧客の customer_id を取得
        user_id = str(user["_id"])
        cursor = db[CUSTOMERS_COLLECTION].find(
            {"assigned_sales_user_id": user_id, "is_active": True},
            {"_id": 1},
        )
        customer_docs = await cursor.to_list(length=1000)
        customer_ids = [str(c["_id"]) for c in customer_docs]
        query["customer_id"] = {"$in": customer_ids}

    contracts_cursor = db[CONTRACTS_COLLECTION].find(query).sort("created_at", -1)
    contracts = await contracts_cursor.to_list(length=1000)

    for c in contracts:
        c["_id"] = str(c["_id"])
        await _enrich_contract(db, c)

    return contracts


async def get_contract(db: AsyncIOMotorDatabase, contract_id: str) -> dict:
    """ID で契約を取得する。

    Args:
        db: MongoDB データベースインスタンス。
        contract_id: 契約の ObjectId 文字列。

    Returns:
        契約ドキュメント。

    Raises:
        HTTPException: 契約が見つからない場合。
    """
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な契約IDです",
        )
    contract = await db[CONTRACTS_COLLECTION].find_one({"_id": ObjectId(contract_id)})
    if contract is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="契約が見つかりません",
        )
    contract["_id"] = str(contract["_id"])
    await _enrich_contract(db, contract)
    return contract


async def create_contract(
    db: AsyncIOMotorDatabase, data: ContractCreate, current_user: dict
) -> dict:
    """契約を作成する。

    Args:
        db: MongoDB データベースインスタンス。
        data: 契約作成データ。
        current_user: 現在のユーザー。

    Returns:
        作成された契約ドキュメント。
    """
    # customer_id, product_id, current_plan_id の存在確認
    if not ObjectId.is_valid(data.customer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な顧客IDです",
        )
    if not ObjectId.is_valid(data.product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    if not ObjectId.is_valid(data.current_plan_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なプランIDです",
        )

    now = datetime.now(timezone.utc)
    doc = {
        **data.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    result = await db[CONTRACTS_COLLECTION].insert_one(doc)
    contract_id = str(result.inserted_id)
    doc["_id"] = contract_id

    # 初期プラン履歴を作成
    await _create_plan_history(
        db,
        contract_id=contract_id,
        plan_id=data.current_plan_id,
        effective_from=data.contract_start_date,
        license_count=data.license_count,
        change_reason="契約作成",
        changed_by_user_id=str(current_user["_id"]),
    )

    # 監査ログ
    await create_audit_log(
        db,
        actor_user_id=str(current_user["_id"]),
        resource_type="contract",
        resource_id=contract_id,
        action="create",
        after=data.model_dump(),
    )

    await _enrich_contract(db, doc)
    return doc


async def update_contract(
    db: AsyncIOMotorDatabase,
    contract_id: str,
    data: ContractUpdate,
    current_user: dict,
) -> dict:
    """契約を更新する。

    Args:
        db: MongoDB データベースインスタンス。
        contract_id: 契約の ObjectId 文字列。
        data: 更新データ。
        current_user: 現在のユーザー。

    Returns:
        更新後の契約ドキュメント。

    Raises:
        HTTPException: 権限エラーまたは契約が見つからない場合。
    """
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な契約IDです",
        )

    # 既存の契約を取得
    existing = await db[CONTRACTS_COLLECTION].find_one({"_id": ObjectId(contract_id)})
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="契約が見つかりません",
        )

    # 権限チェック
    await _check_sales_authorization(db, existing["customer_id"], current_user)

    # 変更前の状態を保存
    before_state = {
        k: v
        for k, v in existing.items()
        if k not in ("_id", "created_at", "updated_at")
    }

    # 更新フィールドを構築
    dumped = data.model_dump()
    update_fields: dict = {}
    for k, v in dumped.items():
        if k == "change_reason":
            continue
        if v is not None:
            update_fields[k] = v

    if not update_fields:
        existing["_id"] = str(existing["_id"])
        await _enrich_contract(db, existing)
        return existing

    # プランまたはライセンス数が変更された場合、履歴を作成
    plan_changed = (
        data.current_plan_id is not None
        and data.current_plan_id != existing.get("current_plan_id")
    )
    license_changed = (
        data.license_count is not None
        and data.license_count != existing.get("license_count")
    )
    if plan_changed or license_changed:
        plan_id = data.current_plan_id or existing["current_plan_id"]
        license_count = data.license_count or existing["license_count"]
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await _create_plan_history(
            db,
            contract_id=contract_id,
            plan_id=plan_id,
            effective_from=today,
            license_count=license_count,
            change_reason=data.change_reason or "プラン/ライセンス変更",
            changed_by_user_id=str(current_user["_id"]),
        )

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db[CONTRACTS_COLLECTION].find_one_and_update(
        {"_id": ObjectId(contract_id)},
        {"$set": update_fields},
        return_document=True,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="契約が見つかりません",
        )
    result["_id"] = str(result["_id"])

    # 監査ログ
    await create_audit_log(
        db,
        actor_user_id=str(current_user["_id"]),
        resource_type="contract",
        resource_id=contract_id,
        action="update",
        before=before_state,
        after=update_fields,
    )

    await _enrich_contract(db, result)
    return result


async def get_contract_history(
    db: AsyncIOMotorDatabase, contract_id: str
) -> list[dict]:
    """契約のプラン変更履歴を取得する。

    Args:
        db: MongoDB データベースインスタンス。
        contract_id: 契約の ObjectId 文字列。

    Returns:
        プラン変更履歴ドキュメントのリスト。
    """
    if not ObjectId.is_valid(contract_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な契約IDです",
        )
    cursor = (
        db[HISTORY_COLLECTION]
        .find({"contract_id": contract_id})
        .sort("effective_from", -1)
    )
    history = await cursor.to_list(length=1000)
    for h in history:
        h["_id"] = str(h["_id"])
    return history
