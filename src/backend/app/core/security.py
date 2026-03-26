"""JWT トークンとパスワードハッシュのユーティリティ。"""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """平文パスワードを bcrypt でハッシュ化する。"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """平文パスワードとハッシュを照合する。"""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """JWT アクセストークンを生成する。

    Args:
        data: トークンに含めるペイロード。
        expires_delta: 有効期限。None の場合は設定値を使用する。

    Returns:
        エンコード済み JWT 文字列。
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """JWT トークンをデコードしてペイロードを返す。

    Args:
        token: エンコード済み JWT 文字列。

    Returns:
        デコード済みペイロード辞書。

    Raises:
        JWTError: トークンが無効または期限切れの場合。
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
