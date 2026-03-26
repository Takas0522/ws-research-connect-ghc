"""契約プラン変更履歴のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.plan import MetricLimit


class ContractPlanHistoryResponse(BaseModel):
    """契約プラン変更履歴レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    contract_id: str
    plan_id: str
    effective_from: str
    effective_to: str | None = None
    monthly_base_fee_snapshot: float
    metric_limits_snapshot: list[MetricLimit]
    license_count_snapshot: int
    change_reason: str
    changed_by_user_id: str
    created_at: datetime
