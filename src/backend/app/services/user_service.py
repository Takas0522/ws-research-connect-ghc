"""ユーザーサービス — ユーザー検索・認証・初期管理者作成・ユーザー管理。"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.security import hash_password, verify_password
from app.schemas.user import UserCreate, UserUpdate

USERS_COLLECTION = "users"


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> dict | None:
    """メールアドレスでユーザーを検索する。

    Args:
        db: MongoDB データベースインスタンス。
        email: 検索するメールアドレス。

    Returns:
        ユーザードキュメント。見つからない場合は None。
    """
    user = await db[USERS_COLLECTION].find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    return user


async def authenticate_user(
    db: AsyncIOMotorDatabase, email: str, password: str
) -> dict | None:
    """メールアドレスとパスワードでユーザーを認証する。

    Args:
        db: MongoDB データベースインスタンス。
        email: メールアドレス。
        password: 平文パスワード。

    Returns:
        認証成功時はユーザードキュメント、失敗時は None。
    """
    user = await get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


async def create_initial_admin(db: AsyncIOMotorDatabase) -> None:
    """ユーザーが 0 件の場合に初期管理者を作成する。

    Args:
        db: MongoDB データベースインスタンス。
    """
    count = await db[USERS_COLLECTION].count_documents({})
    if count > 0:
        return

    now = datetime.now(timezone.utc)
    admin_user = {
        "email": "admin@example.com",
        "password_hash": hash_password("admin123"),
        "display_name": "管理者",
        "role": "admin",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db[USERS_COLLECTION].insert_one(admin_user)


async def get_users(db: AsyncIOMotorDatabase) -> list[dict]:
    """全ユーザーを取得する（password_hash を除外）。

    Args:
        db: MongoDB データベースインスタンス。

    Returns:
        ユーザードキュメントのリスト。
    """
    cursor = db[USERS_COLLECTION].find({}, {"password_hash": 0})
    users = await cursor.to_list(length=1000)
    for u in users:
        u["_id"] = str(u["_id"])
    return users


async def create_user(db: AsyncIOMotorDatabase, data: UserCreate) -> dict:
    """ユーザーを作成する。

    Args:
        db: MongoDB データベースインスタンス。
        data: ユーザー作成データ。

    Returns:
        作成されたユーザードキュメント。

    Raises:
        HTTPException: メールアドレスが重複している場合 (409)。
    """
    now = datetime.now(timezone.utc)
    doc = {
        "email": data.email,
        "password_hash": hash_password(data.password),
        "display_name": data.display_name,
        "role": data.role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[USERS_COLLECTION].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="メールアドレスが既に登録されています",
        )
    doc["_id"] = str(result.inserted_id)
    doc.pop("password_hash", None)
    return doc


async def update_user(
    db: AsyncIOMotorDatabase, user_id: str, data: UserUpdate
) -> dict | None:
    """ユーザーを更新する。

    Args:
        db: MongoDB データベースインスタンス。
        user_id: 更新対象のユーザー ID。
        data: 更新データ（None のフィールドはスキップ）。

    Returns:
        更新後のユーザードキュメント。見つからない場合は None。
    """
    update_fields: dict = {}
    for field, value in data.model_dump(exclude_none=True).items():
        update_fields[field] = value

    if not update_fields:
        user = await db[USERS_COLLECTION].find_one(
            {"_id": ObjectId(user_id)}, {"password_hash": 0}
        )
        if user:
            user["_id"] = str(user["_id"])
        return user

    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = await db[USERS_COLLECTION].find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields},
        projection={"password_hash": 0},
        return_document=True,
    )
    if result:
        result["_id"] = str(result["_id"])
    return result


async def deactivate_user(db: AsyncIOMotorDatabase, user_id: str) -> dict | None:
    """ユーザーを無効化する。

    Args:
        db: MongoDB データベースインスタンス。
        user_id: 無効化対象のユーザー ID。

    Returns:
        更新後のユーザードキュメント。見つからない場合は None。
    """
    now = datetime.now(timezone.utc)
    result = await db[USERS_COLLECTION].find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": now}},
        projection={"password_hash": 0},
        return_document=True,
    )
    if result:
        result["_id"] = str(result["_id"])
    return result
