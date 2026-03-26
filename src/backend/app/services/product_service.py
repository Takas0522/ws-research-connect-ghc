"""製品マスタの CRUD サービス。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.schemas.product import ProductCreate, ProductUpdate

COLLECTION = "products"


async def get_products(db: AsyncIOMotorDatabase) -> list[dict]:
    """アクティブな全製品を取得する。"""
    cursor = db[COLLECTION].find({"is_active": True})
    products = await cursor.to_list(length=1000)
    for p in products:
        p["_id"] = str(p["_id"])
    return products


async def get_product(db: AsyncIOMotorDatabase, product_id: str) -> dict:
    """製品を ID で取得する。

    Raises:
        HTTPException: 製品が見つからない場合。
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    product = await db[COLLECTION].find_one({"_id": ObjectId(product_id)})
    if product is None or not product.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="製品が見つかりません",
        )
    product["_id"] = str(product["_id"])
    return product


async def create_product(db: AsyncIOMotorDatabase, data: ProductCreate) -> dict:
    """製品を作成する。

    Raises:
        HTTPException: 製品コードが重複している場合。
    """
    now = datetime.now(timezone.utc)
    doc = {
        **data.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[COLLECTION].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="製品コードが重複しています",
        )
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_product(
    db: AsyncIOMotorDatabase, product_id: str, data: ProductUpdate
) -> dict:
    """製品を更新する。

    Raises:
        HTTPException: 製品が見つからない場合。
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        return await get_product(db, product_id)

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(product_id), "is_active": True},
        {"$set": update_fields},
        return_document=True,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="製品が見つかりません",
        )
    result["_id"] = str(result["_id"])
    return result


async def delete_product(db: AsyncIOMotorDatabase, product_id: str) -> None:
    """製品を論理削除する（is_active=False に設定）。

    Raises:
        HTTPException: 製品が見つからない場合。
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な製品IDです",
        )
    result = await db[COLLECTION].update_one(
        {"_id": ObjectId(product_id), "is_active": True},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="製品が見つかりません",
        )
