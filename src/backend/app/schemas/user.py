"""ユーザー関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    """ユーザーレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id", description="ユーザー ID")
    email: str = Field(..., description="メールアドレス")
    display_name: str = Field(..., description="表示名")
    role: str = Field(..., description="ロール")
    is_active: bool = Field(..., description="有効フラグ")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")


class UserCreate(BaseModel):
    """ユーザー作成リクエスト。"""

    email: str = Field(..., min_length=1, description="メールアドレス")
    display_name: str = Field(..., min_length=1, max_length=200, description="表示名")
    role: str = Field(..., pattern="^(sales|admin)$", description="ロール")
    password: str = Field(..., min_length=6, description="パスワード")


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト。None のフィールドは更新しない。"""

    display_name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = Field(None, pattern="^(sales|admin)$")
    is_active: bool | None = None
