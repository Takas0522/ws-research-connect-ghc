"""顧客サービス — 顧客 CRUD 操作。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.schemas.customer import CustomerCreate, CustomerUpdate

CUSTOMERS_COLLECTION = "customers"


async def get_customers(db: AsyncIOMotorDatabase) -> list[dict]:
    """有効な全顧客を取得する。

    Args:
        db: MongoDB データベースインスタンス。

    Returns:
        顧客ドキュメントのリスト。
    """
    cursor = db[CUSTOMERS_COLLECTION].find({"is_active": True})
    customers = await cursor.to_list(length=1000)
    for c in customers:
        c["_id"] = str(c["_id"])
    return customers


async def get_customer(db: AsyncIOMotorDatabase, customer_id: str) -> dict:
    """ID で顧客を取得する。

    Args:
        db: MongoDB データベースインスタンス。
        customer_id: 顧客の ObjectId 文字列。

    Returns:
        顧客ドキュメント。

    Raises:
        HTTPException: 顧客が見つからない場合。
    """
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な顧客IDです",
        )
    customer = await db[CUSTOMERS_COLLECTION].find_one({"_id": ObjectId(customer_id)})
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="顧客が見つかりません",
        )
    customer["_id"] = str(customer["_id"])
    return customer


async def create_customer(db: AsyncIOMotorDatabase, data: CustomerCreate) -> dict:
    """顧客を作成する。

    Args:
        db: MongoDB データベースインスタンス。
        data: 顧客作成データ。

    Returns:
        作成された顧客ドキュメント。

    Raises:
        HTTPException: 顧客コードが重複している場合。
    """
    now = datetime.now(timezone.utc)
    doc = {
        **data.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[CUSTOMERS_COLLECTION].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="顧客コードが重複しています",
        )
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_customer(
    db: AsyncIOMotorDatabase, customer_id: str, data: CustomerUpdate
) -> dict:
    """顧客を更新する。

    Args:
        db: MongoDB データベースインスタンス。
        customer_id: 顧客の ObjectId 文字列。
        data: 更新データ。None のフィールドはスキップする。

    Returns:
        更新後の顧客ドキュメント。

    Raises:
        HTTPException: 顧客が見つからない場合。
    """
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な顧客IDです",
        )
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc)

    result = await db[CUSTOMERS_COLLECTION].find_one_and_update(
        {"_id": ObjectId(customer_id)},
        {"$set": update_fields},
        return_document=True,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="顧客が見つかりません",
        )
    result["_id"] = str(result["_id"])
    return result


async def delete_customer(db: AsyncIOMotorDatabase, customer_id: str) -> None:
    """顧客を論理削除する（is_active=False に設定）。

    Args:
        db: MongoDB データベースインスタンス。
        customer_id: 顧客の ObjectId 文字列。

    Raises:
        HTTPException: 顧客が見つからない場合。
    """
    if not ObjectId.is_valid(customer_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無効な顧客IDです",
        )
    result = await db[CUSTOMERS_COLLECTION].update_one(
        {"_id": ObjectId(customer_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="顧客が見つかりません",
        )
