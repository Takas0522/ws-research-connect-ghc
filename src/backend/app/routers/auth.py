"""認証エンドポイント。"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_database
from app.core.security import create_access_token
from app.dependencies.auth import get_current_user
from app.schemas.auth import TokenResponse
from app.schemas.user import UserResponse
from app.services.user_service import authenticate_user

router = APIRouter(prefix="/api/auth", tags=["認証"])


@router.post("/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    """OAuth2 パスワード認証でアクセストークンを発行する。

    Args:
        form_data: ユーザー名（メールアドレス）とパスワード。

    Returns:
        JWT アクセストークン。
    """
    db = get_database()
    user = await authenticate_user(db, form_data.username, form_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["email"]})
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)) -> dict:
    """現在のログインユーザー情報を返す。

    Args:
        current_user: JWT から取得した現在のユーザー。

    Returns:
        ユーザー情報。
    """
    return current_user
