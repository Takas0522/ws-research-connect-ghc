"""プランマスタのリクエスト/レスポンススキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricLimit(BaseModel):
    """メトリクス上限の定義。"""

    metric_code: str = Field(..., min_length=1, description="メトリクスコード")
    limit_value: float = Field(..., ge=0, description="上限値")
    overage_unit_price: float = Field(..., ge=0, description="超過単価")


class PlanCreate(BaseModel):
    """プラン作成リクエスト。"""

    plan_code: str = Field(
        ..., min_length=1, max_length=50, description="プランコード（ユニーク）"
    )
    plan_name: str = Field(..., min_length=1, max_length=200, description="プラン名")
    monthly_base_fee: float = Field(..., ge=0, description="月額基本料")
    alert_threshold_pct: int = Field(90, ge=1, le=100, description="アラート閾値（%）")
    metric_limits: list[MetricLimit] = Field(
        default_factory=list, description="メトリクス上限"
    )


class PlanUpdate(BaseModel):
    """プラン更新リクエスト。None のフィールドは更新しない。"""

    plan_name: str | None = Field(None, min_length=1, max_length=200)
    monthly_base_fee: float | None = Field(None, ge=0)
    alert_threshold_pct: int | None = Field(None, ge=1, le=100)
    metric_limits: list[MetricLimit] | None = None


class PlanResponse(BaseModel):
    """プランレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    product_id: str
    plan_code: str
    plan_name: str
    monthly_base_fee: float
    alert_threshold_pct: int
    metric_limits: list[MetricLimit]
    is_active: bool
    created_at: datetime
    updated_at: datetime
