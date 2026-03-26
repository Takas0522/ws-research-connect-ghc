"""製品マスタのスキーマ定義。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """製品作成リクエスト。"""

    product_code: str = Field(
        ..., min_length=1, max_length=50, description="製品コード（ユニーク）"
    )
    product_name: str = Field(..., min_length=1, max_length=200, description="製品名")
    category: str = Field(..., min_length=1, description="カテゴリ")
    vendor: str = Field(..., min_length=1, description="ベンダー")


class ProductUpdate(BaseModel):
    """製品更新リクエスト。None のフィールドは更新しない。"""

    product_name: str | None = Field(None, min_length=1, max_length=200)
    category: str | None = None
    vendor: str | None = None


class ProductResponse(BaseModel):
    """製品レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    product_code: str
    product_name: str
    category: str
    vendor: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
