"""プランマスタの CRUD サービス。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.schemas.plan import PlanCreate, PlanUpdate

COLLECTION = "plans"


async def get_plans(db: AsyncIOMotorDatabase, product_id: str) -> list[dict]:
    """指定された製品のアクティブなプラン一覧を取得する。"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    cursor = db[COLLECTION].find({"product_id": product_id, "is_active": True})
    plans = await cursor.to_list(length=1000)
    for p in plans:
        p["_id"] = str(p["_id"])
    return plans


async def get_plan(db: AsyncIOMotorDatabase, plan_id: str) -> dict:
    """プランを ID で取得する。

    Raises:
        HTTPException: プランが見つからない場合。
    """
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なプランIDです",
        )
    plan = await db[COLLECTION].find_one({"_id": ObjectId(plan_id)})
    if plan is None or not plan.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プランが見つかりません",
        )
    plan["_id"] = str(plan["_id"])
    return plan


async def create_plan(
    db: AsyncIOMotorDatabase, product_id: str, data: PlanCreate
) -> dict:
    """プランを作成する。

    Raises:
        HTTPException: プランコードが重複している場合。
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    now = datetime.now(timezone.utc)
    doc = {
        **data.model_dump(),
        "product_id": product_id,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    # metric_limits は既に list[dict] に変換済み（model_dump による）
    try:
        result = await db[COLLECTION].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="プランコードが重複しています",
        )
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_plan(db: AsyncIOMotorDatabase, plan_id: str, data: PlanUpdate) -> dict:
    """プランを更新する。

    Raises:
        HTTPException: プランが見つからない場合。
    """
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なプランIDです",
        )
    dumped = data.model_dump()
    update_fields: dict = {}
    for k, v in dumped.items():
        if v is not None:
            if k == "metric_limits":
                # MetricLimit のリストを dict のリストに変換
                update_fields[k] = [
                    ml.model_dump() if hasattr(ml, "model_dump") else ml
                    for ml in data.metric_limits  # type: ignore[union-attr]
                ]
            else:
                update_fields[k] = v

    if not update_fields:
        return await get_plan(db, plan_id)

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(plan_id), "is_active": True},
        {"$set": update_fields},
        return_document=True,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プランが見つかりません",
        )
    result["_id"] = str(result["_id"])
    return result


async def delete_plan(db: AsyncIOMotorDatabase, plan_id: str) -> None:
    """プランを論理削除する（is_active=False に設定）。

    Raises:
        HTTPException: プランが見つからない場合。
    """
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なプランIDです",
        )
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(plan_id), "is_active": True},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プランが見つかりません",
        )
