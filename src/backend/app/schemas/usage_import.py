"""従量データ取込関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ImportPreviewRecord(BaseModel):
    """取込プレビューの各レコード。"""

    customer_code: str
    product_code: str
    metric_code: str
    actual_value: float
    limit_value: float | None = None
    usage_rate: float | None = None
    overage_count: float | None = None
    overage_fee: float | None = None
    status: str = Field(..., description="ok または error")
    error_message: str | None = None


class ImportPreviewResponse(BaseModel):
    """CSV アップロード後のプレビューレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    import_id: str
    billing_month: str
    file_name: str
    record_count: int
    error_count: int
    error_details: list[str]
    records: list[ImportPreviewRecord]
    replace_mode: bool
    status: str


class UsageImportResponse(BaseModel):
    """取込履歴レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    billing_month: str
    source_type: str
    file_name: str
    replace_mode: bool
    status: str
    uploaded_by_user_id: str
    record_count: int
    error_count: int
    error_details: list[str]
    created_at: datetime
    confirmed_at: datetime | None = None
