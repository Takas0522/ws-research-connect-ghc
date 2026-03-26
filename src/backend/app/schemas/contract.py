"""契約管理関連のスキーマ。"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ContractCreate(BaseModel):
    """契約作成リクエスト。"""

    customer_id: str = Field(..., min_length=1, description="顧客ID")
    product_id: str = Field(..., min_length=1, description="製品ID")
    current_plan_id: str = Field(..., min_length=1, description="プランID")
    contract_start_date: str = Field(
        ..., min_length=10, max_length=10, description="契約開始日 (YYYY-MM-DD)"
    )
    contract_end_date: str | None = Field(
        None, max_length=10, description="契約終了日 (YYYY-MM-DD)"
    )
    contract_renewal_date: str = Field(
        ..., min_length=10, max_length=10, description="契約更新日 (YYYY-MM-DD)"
    )
    license_count: int = Field(..., ge=1, description="ライセンス数")
    status: Literal["active", "renewing", "suspended", "terminated"] = Field(
        "active", description="ステータス"
    )
    primary_use_case: Literal[
        "sales_ops", "customer_support", "analytics", "integration", "other"
    ] = Field(..., description="主な利用目的")


class ContractUpdate(BaseModel):
    """契約更新リクエスト。None のフィールドは更新しない。"""

    current_plan_id: str | None = Field(None, min_length=1)
    contract_end_date: str | None = Field(None, max_length=10)
    contract_renewal_date: str | None = Field(None, min_length=10, max_length=10)
    license_count: int | None = Field(None, ge=1)
    status: Literal["active", "renewing", "suspended", "terminated"] | None = None
    primary_use_case: (
        Literal["sales_ops", "customer_support", "analytics", "integration", "other"]
        | None
    ) = None
    change_reason: str | None = Field(None, description="変更理由")


class ContractResponse(BaseModel):
    """契約レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    customer_id: str
    product_id: str
    current_plan_id: str
    contract_start_date: str
    contract_end_date: str | None = None
    contract_renewal_date: str
    license_count: int
    status: str
    primary_use_case: str
    customer_name: str | None = None
    product_name: str | None = None
    plan_name: str | None = None
    created_at: datetime
    updated_at: datetime
