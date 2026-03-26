"""顧客マスタ関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CustomerCreate(BaseModel):
    """顧客作成リクエスト。"""

    customer_code: str = Field(
        ..., min_length=1, max_length=50, description="顧客コード（ユニーク）"
    )
    customer_name: str = Field(..., min_length=1, max_length=200, description="顧客名")
    assigned_sales_user_id: str | None = Field(None, description="担当営業ユーザーID")
    contact_person: str | None = Field(None, max_length=200, description="担当者名")
    notes: str | None = Field(None, description="備考")


class CustomerUpdate(BaseModel):
    """顧客更新リクエスト。None のフィールドは更新しない。"""

    customer_name: str | None = Field(None, min_length=1, max_length=200)
    assigned_sales_user_id: str | None = None
    contact_person: str | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    """顧客レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    customer_code: str
    customer_name: str
    assigned_sales_user_id: str | None = None
    contact_person: str | None = None
    notes: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
