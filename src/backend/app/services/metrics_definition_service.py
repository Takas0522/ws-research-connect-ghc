"""メトリクス定義の CRUD サービス。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.schemas.metrics_definition import (
    MetricsDefinitionCreate,
    MetricsDefinitionUpdate,
)

COLLECTION = "metrics_definitions"


async def get_metrics_definitions(
    db: AsyncIOMotorDatabase, product_id: str
) -> list[dict]:
    """指定製品のアクティブなメトリクス定義を取得する。"""
    cursor = db[COLLECTION].find({"product_id": product_id, "is_active": True})
    definitions = await cursor.to_list(length=1000)
    for d in definitions:
        d["_id"] = str(d["_id"])
    return definitions


async def create_metrics_definition(
    db: AsyncIOMotorDatabase,
    product_id: str,
    data: MetricsDefinitionCreate,
) -> dict:
    """メトリクス定義を作成する。

    Raises:
        HTTPException: メトリクスコードが重複している場合。
    """
    now = datetime.now(timezone.utc)
    doc = {
        **data.model_dump(),
        "product_id": product_id,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[COLLECTION].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="メトリクスコードが重複しています",
        )
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_metrics_definition(
    db: AsyncIOMotorDatabase,
    definition_id: str,
    data: MetricsDefinitionUpdate,
) -> dict:
    """メトリクス定義を更新する。

    Raises:
        HTTPException: メトリクス定義が見つからない場合。
    """
    if not ObjectId.is_valid(definition_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なメトリクス定義IDです",
        )
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        definition = await db[COLLECTION].find_one(
            {"_id": ObjectId(definition_id), "is_active": True}
        )
        if definition is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="メトリクス定義が見つかりません",
            )
        definition["_id"] = str(definition["_id"])
        return definition

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(definition_id), "is_active": True},
        {"$set": update_fields},
        return_document=True,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="メトリクス定義が見つかりません",
        )
    result["_id"] = str(result["_id"])
    return result


async def delete_metrics_definition(
    db: AsyncIOMotorDatabase, definition_id: str
) -> None:
    """メトリクス定義を論理削除する（is_active=False に設定）。

    Raises:
        HTTPException: メトリクス定義が見つからない場合。
    """
    if not ObjectId.is_valid(definition_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効なメトリクス定義IDです",
        )
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(definition_id), "is_active": True},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="メトリクス定義が見つかりません",
        )
