"""認証関連の依存性注入。"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.core.database import get_database
from app.core.security import decode_access_token
from app.services.user_service import get_user_by_email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Bearer トークンから現在のユーザーを取得する。

    Args:
        token: JWT アクセストークン。

    Returns:
        ユーザードキュメント。

    Raises:
        HTTPException: トークンが無効またはユーザーが無効の場合。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await get_user_by_email(db, email)
    if user is None or not user.get("is_active", False):
        raise credentials_exception
    return user


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """管理者権限を持つユーザーを取得する。

    Args:
        current_user: 現在のユーザー。

    Returns:
        管理者ユーザードキュメント。

    Raises:
        HTTPException: 管理者権限がない場合。
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )
    return current_user
