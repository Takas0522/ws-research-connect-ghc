"""ポータル認証関連のスキーマ。"""

from pydantic import BaseModel, EmailStr, Field


class PortalSignupRequest(BaseModel):
    """ポータルユーザー登録リクエスト。"""

    email: EmailStr = Field(..., description="メールアドレス")
    password: str = Field(..., min_length=8, description="パスワード（8文字以上）")
    display_name: str = Field(..., min_length=1, max_length=100, description="表示名")
    tenant_code: str = Field(
        ..., min_length=1, max_length=50, description="テナントコード"
    )


class PortalLoginRequest(BaseModel):
    """ポータルログインリクエスト。"""

    email: EmailStr = Field(..., description="メールアドレス")
    password: str = Field(..., description="パスワード")


class PortalTokenResponse(BaseModel):
    """ポータル JWT トークンレスポンス。"""

    access_token: str = Field(..., description="JWT アクセストークン")
    refresh_token: str = Field(..., description="JWT リフレッシュトークン")
    token_type: str = Field(default="bearer", description="トークン種別")


class PortalUserResponse(BaseModel):
    """ポータルユーザー情報レスポンス。"""

    id: str = Field(..., description="ユーザー ID")
    email: str = Field(..., description="メールアドレス")
    display_name: str = Field(..., description="表示名")
    role: str = Field(..., description="ロール (admin | member)")
    tenant_id: str = Field(..., description="テナント ID")
    tenant_code: str = Field(..., description="テナントコード")
    tenant_name: str = Field(..., description="テナント名")
    plan_tier: str = Field(
        ..., description="プランティア (free | standard | enterprise)"
    )


class PortalRefreshRequest(BaseModel):
    """トークンリフレッシュリクエスト。"""

    refresh_token: str = Field(..., description="リフレッシュトークン")
