"""月次従量データ関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MonthlyUsageResponse(BaseModel):
    """月次従量データレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    contract_id: str
    customer_id: str
    product_id: str
    billing_month: str
    metric_code: str
    actual_value: float
    limit_value_snapshot: float
    usage_rate: float
    overage_count: float
    overage_fee: float
    import_id: str
    imported_at: datetime
