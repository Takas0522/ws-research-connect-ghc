"""ポータル認証エンドポイント。"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_database
from app.dependencies.portal_auth import PortalUser, get_current_portal_user
from app.schemas.portal_auth import (
    PortalLoginRequest,
    PortalRefreshRequest,
    PortalSignupRequest,
    PortalTokenResponse,
    PortalUserResponse,
)
from app.services import portal_auth_service

router = APIRouter(prefix="/api/portal/auth", tags=["Portal Auth"])


@router.post("/signup", response_model=PortalTokenResponse, status_code=201)
async def signup(data: PortalSignupRequest) -> PortalTokenResponse:
    """ポータルユーザーを新規登録し、JWT トークンを発行する。

    Args:
        data: サインアップリクエスト。

    Returns:
        JWT アクセストークンとリフレッシュトークン。
    """
    db = get_database()
    try:
        return await portal_auth_service.signup(
            db,
            email=data.email,
            password=data.password,
            display_name=data.display_name,
            tenant_code=data.tenant_code,
        )
    except ValueError as e:
        msg = str(e)
        if "既に登録" in msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )


@router.post("/login", response_model=PortalTokenResponse)
async def login(data: PortalLoginRequest) -> PortalTokenResponse:
    """ポータルユーザーを認証し、JWT トークンを発行する。

    Args:
        data: ログインリクエスト。

    Returns:
        JWT アクセストークンとリフレッシュトークン。
    """
    db = get_database()
    try:
        return await portal_auth_service.login(
            db,
            email=data.email,
            password=data.password,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/refresh", response_model=PortalTokenResponse)
async def refresh(data: PortalRefreshRequest) -> PortalTokenResponse:
    """リフレッシュトークンで新しいアクセストークンを発行する。

    Args:
        data: リフレッシュリクエスト。

    Returns:
        新しい JWT アクセストークンとリフレッシュトークン。
    """
    db = get_database()
    try:
        return await portal_auth_service.refresh_token(
            db,
            refresh_token_str=data.refresh_token,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=PortalUserResponse)
async def get_me(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> PortalUserResponse:
    """現在のログインユーザー情報を返す。

    Args:
        current_user: JWT から取得した現在のポータルユーザー。

    Returns:
        ユーザー情報（テナント名・プランティアを含む）。
    """
    db = get_database()
    try:
        return await portal_auth_service.get_me(db, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
