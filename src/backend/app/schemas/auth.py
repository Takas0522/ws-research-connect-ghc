"""認証関連のスキーマ。"""

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    """JWT トークンレスポンス。"""

    access_token: str = Field(..., description="JWT アクセストークン")
    token_type: str = Field(default="bearer", description="トークン種別")
