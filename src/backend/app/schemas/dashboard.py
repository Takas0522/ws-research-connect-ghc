"""ダッシュボード関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, Field


class UsageSummaryMetric(BaseModel):
    """利用量サマリーのメトリクス。"""

    metric_code: str
    actual_value: float
    limit_value: float
    usage_rate: float
    overage_fee: float


class UsageSummaryResponse(BaseModel):
    """顧客×製品ごとの利用量サマリーレスポンス。"""

    customer_id: str
    customer_name: str
    product_id: str
    product_name: str
    plan_name: str
    billing_month: str
    metrics: list[UsageSummaryMetric]
    alert_threshold_pct: int
    has_alert: bool


class UsageAlertResponse(BaseModel):
    """利用量アラートレスポンス。"""

    customer_name: str
    product_name: str
    metric_code: str
    billing_month: str
    usage_rate: float
    limit_value: float
    actual_value: float
    alert_threshold_pct: int


class TrendPointResponse(BaseModel):
    """月次トレンドの1データポイント。"""

    billing_month: str
    metric_code: str
    actual_value: float | None = None
    limit_value: float | None = None
    usage_rate: float | None = None


class UseCaseSummaryResponse(BaseModel):
    """利用目的別サマリーレスポンス。"""

    use_case: str
    count: int
    label: str


class LastUpdatedResponse(BaseModel):
    """最終更新日時レスポンス。"""

    last_updated: datetime | None = Field(None, description="最終取込確定日時")
