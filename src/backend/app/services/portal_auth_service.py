"""ポータル認証サービス — サインアップ・ログイン・トークンリフレッシュ。"""

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from jose import JWTError
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.schemas.portal_auth import (
    PortalTokenResponse,
    PortalUserResponse,
)

PORTAL_TENANTS_COLLECTION = "portal_tenants"
PORTAL_USERS_COLLECTION = "portal_users"

REFRESH_TOKEN_EXPIRE_DAYS = 7


def _create_portal_tokens(user: dict, tenant: dict) -> PortalTokenResponse:
    """アクセストークンとリフレッシュトークンを生成する。

    Args:
        user: portal_users ドキュメント。
        tenant: portal_tenants ドキュメント。

    Returns:
        アクセストークンとリフレッシュトークンを含むレスポンス。
    """
    payload = {
        "sub": str(user["_id"]),
        "tenant_id": str(user["tenant_id"]),
        "tenant_code": tenant["tenant_code"],
        "role": user["role"],
    }
    access_token = create_access_token(data=payload)

    refresh_payload = {
        **payload,
        "type": "refresh",
    }
    refresh_token = create_access_token(
        data=refresh_payload,
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return PortalTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


async def signup(
    db: AsyncIOMotorDatabase,
    email: str,
    password: str,
    display_name: str,
    tenant_code: str,
) -> PortalTokenResponse:
    """新規ポータルユーザーを登録し、トークンを発行する。

    Args:
        db: MongoDB データベースインスタンス。
        email: メールアドレス。
        password: 平文パスワード。
        display_name: 表示名。
        tenant_code: テナントコード。

    Returns:
        JWT トークンレスポンス。

    Raises:
        ValueError: テナントが見つからない場合。
        ValueError: メールアドレスが既に登録されている場合。
    """
    tenant = await db[PORTAL_TENANTS_COLLECTION].find_one({"tenant_code": tenant_code})
    if tenant is None:
        raise ValueError("テナントが見つかりません")

    existing_user = await db[PORTAL_USERS_COLLECTION].find_one({"email": email})
    if existing_user is not None:
        raise ValueError("このメールアドレスは既に登録されています")

    now = datetime.now(timezone.utc)
    user_doc = {
        "tenant_id": tenant["_id"],
        "email": email,
        "hashed_password": hash_password(password),
        "display_name": display_name,
        "role": "member",
        "is_active": True,
        "last_login_at": None,
        "created_at": now,
        "updated_at": now,
    }
    result = await db[PORTAL_USERS_COLLECTION].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    return _create_portal_tokens(user_doc, tenant)


async def login(
    db: AsyncIOMotorDatabase,
    email: str,
    password: str,
) -> PortalTokenResponse:
    """ポータルユーザーを認証し、トークンを発行する。

    Args:
        db: MongoDB データベースインスタンス。
        email: メールアドレス。
        password: 平文パスワード。

    Returns:
        JWT トークンレスポンス。

    Raises:
        ValueError: 認証に失敗した場合。
    """
    user = await db[PORTAL_USERS_COLLECTION].find_one({"email": email})
    if user is None:
        raise ValueError("メールアドレスまたはパスワードが正しくありません")

    if not verify_password(password, user["hashed_password"]):
        raise ValueError("メールアドレスまたはパスワードが正しくありません")

    if not user.get("is_active", False):
        raise ValueError("このアカウントは無効化されています")

    tenant = await db[PORTAL_TENANTS_COLLECTION].find_one({"_id": user["tenant_id"]})
    if tenant is None:
        raise ValueError("テナント情報が見つかりません")

    now = datetime.now(timezone.utc)
    await db[PORTAL_USERS_COLLECTION].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": now, "updated_at": now}},
    )

    return _create_portal_tokens(user, tenant)


async def refresh_token(
    db: AsyncIOMotorDatabase,
    refresh_token_str: str,
) -> PortalTokenResponse:
    """リフレッシュトークンで新しいアクセストークンを発行する。

    Args:
        db: MongoDB データベースインスタンス。
        refresh_token_str: リフレッシュトークン文字列。

    Returns:
        新しいアクセストークンを含むレスポンス。

    Raises:
        ValueError: トークンが無効または期限切れの場合。
    """
    try:
        payload = decode_access_token(refresh_token_str)
    except JWTError:
        raise ValueError("リフレッシュトークンが無効です")

    if payload.get("type") != "refresh":
        raise ValueError("リフレッシュトークンが無効です")

    user_id = payload.get("sub")
    if user_id is None:
        raise ValueError("リフレッシュトークンが無効です")

    user = await db[PORTAL_USERS_COLLECTION].find_one(
        {"_id": ObjectId(user_id), "is_active": True}
    )
    if user is None:
        raise ValueError("ユーザーが見つかりません")

    tenant = await db[PORTAL_TENANTS_COLLECTION].find_one({"_id": user["tenant_id"]})
    if tenant is None:
        raise ValueError("テナント情報が見つかりません")

    # 新しいアクセストークンのみ発行し、リフレッシュトークンはそのまま返す
    access_payload = {
        "sub": str(user["_id"]),
        "tenant_id": str(user["tenant_id"]),
        "tenant_code": tenant["tenant_code"],
        "role": user["role"],
    }
    new_access_token = create_access_token(data=access_payload)

    return PortalTokenResponse(
        access_token=new_access_token,
        refresh_token=refresh_token_str,
    )


async def get_me(
    db: AsyncIOMotorDatabase,
    user_id: str,
) -> PortalUserResponse:
    """ポータルユーザー情報をテナント情報と結合して返す。

    Args:
        db: MongoDB データベースインスタンス。
        user_id: ユーザー ID 文字列。

    Returns:
        ユーザー情報レスポンス。

    Raises:
        ValueError: ユーザーが見つからない場合。
    """
    user = await db[PORTAL_USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise ValueError("ユーザーが見つかりません")

    tenant = await db[PORTAL_TENANTS_COLLECTION].find_one({"_id": user["tenant_id"]})
    if tenant is None:
        raise ValueError("テナント情報が見つかりません")

    return PortalUserResponse(
        id=str(user["_id"]),
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        tenant_id=str(user["tenant_id"]),
        tenant_code=tenant["tenant_code"],
        tenant_name=tenant["tenant_name"],
        plan_tier=tenant["plan_tier"],
    )
