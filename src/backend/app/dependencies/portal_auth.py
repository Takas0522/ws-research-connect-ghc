"""ポータル認証関連の依存性注入。"""

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from pydantic import BaseModel, Field

from app.core.database import get_database
from app.core.security import decode_access_token

oauth2_portal_scheme = OAuth2PasswordBearer(tokenUrl="/api/portal/auth/login")


class PortalUser(BaseModel):
    """JWT から復元されたポータルユーザー。"""

    id: str = Field(..., description="ユーザー ID")
    tenant_id: str = Field(..., description="テナント ID")
    tenant_code: str = Field(..., description="テナントコード")
    role: str = Field(..., description="ロール (admin | member)")
    email: str = Field(..., description="メールアドレス")


async def get_current_portal_user(
    token: str = Depends(oauth2_portal_scheme),
) -> PortalUser:
    """ポータル専用 JWT からユーザーを取得する。

    Args:
        token: JWT アクセストークン。

    Returns:
        ポータルユーザー情報。

    Raises:
        HTTPException: トークンが無効またはユーザーが見つからない場合。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        tenant_id: str | None = payload.get("tenant_id")
        tenant_code: str | None = payload.get("tenant_code")
        role: str | None = payload.get("role")

        if not user_id or not tenant_id:
            raise credentials_exception

        # リフレッシュトークンをアクセストークンとして使えないようにする
        if payload.get("type") == "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await db["portal_users"].find_one(
        {"_id": ObjectId(user_id), "is_active": True}
    )
    if user is None:
        raise credentials_exception

    return PortalUser(
        id=str(user["_id"]),
        tenant_id=str(user["tenant_id"]),
        tenant_code=tenant_code or "",
        role=role or user["role"],
        email=user["email"],
    )


def require_portal_admin(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> PortalUser:
    """テナント管理者のみ許可する。

    Args:
        current_user: 現在のポータルユーザー。

    Returns:
        管理者ユーザー。

    Raises:
        HTTPException: 管理者権限がない場合。
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="テナント管理者権限が必要です",
        )
    return current_user
