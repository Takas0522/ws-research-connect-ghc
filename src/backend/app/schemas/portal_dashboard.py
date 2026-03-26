"""ポータルダッシュボードのリクエスト/レスポンススキーマ。"""

from pydantic import BaseModel, Field


class ServiceUsageSummary(BaseModel):
    """サービスごとの利用状況サマリー。"""

    service_code: str = Field(..., description="サービスコード")
    service_name: str = Field(..., description="サービス名")
    plan_name: str = Field(..., description="プラン名")
    metric_name: str = Field(..., description="従量メトリクス名")
    quantity: int = Field(..., description="当月利用量")
    free_tier_limit: int = Field(..., description="無料枠上限")
    usage_rate: float = Field(..., description="利用率 (%)")
    billed_amount: float = Field(..., description="請求額")
    mom_change: float | None = Field(None, description="前月比変化率 (%)")


class DashboardSummaryResponse(BaseModel):
    """ダッシュボードサマリーレスポンス。"""

    tenant_name: str = Field(..., description="テナント名")
    total_services: int = Field(..., description="契約サービス数")
    total_billed_amount: float = Field(..., description="合計請求額")
    services: list[ServiceUsageSummary] = Field(
        default_factory=list, description="サービス別利用状況"
    )


class UsageTrendItem(BaseModel):
    """月次利用推移の1レコード。"""

    year_month: str = Field(..., description="年月 (YYYY-MM)")
    service_code: str = Field(..., description="サービスコード")
    service_name: str = Field(..., description="サービス名")
    quantity: int = Field(..., description="利用量")
    billed_amount: float = Field(..., description="請求額")


class UsageTrendResponse(BaseModel):
    """月次利用推移レスポンス。"""

    trends: list[UsageTrendItem] = Field(default_factory=list, description="推移データ")
    period_start: str = Field(..., description="期間開始 (YYYY-MM)")
    period_end: str = Field(..., description="期間終了 (YYYY-MM)")


class UsagePurposeItem(BaseModel):
    """利用目的別集計の1レコード。"""

    primary_use_case: str = Field(..., description="利用目的")
    count: int = Field(..., description="レコード件数")
    total_quantity: int = Field(..., description="合計利用量")


class UsageByPurposeResponse(BaseModel):
    """利用目的別集計レスポンス。"""

    purposes: list[UsagePurposeItem] = Field(
        default_factory=list, description="利用目的別データ"
    )
