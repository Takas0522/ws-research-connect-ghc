"""ポータル利用詳細関連のスキーマ。"""

from pydantic import BaseModel, Field


class ServiceUsageDetail(BaseModel):
    """月次利用詳細。"""

    year_month: str = Field(..., description="対象年月 (YYYY-MM)")
    metric_name: str = Field(..., description="メトリクス名")
    quantity: int = Field(..., description="利用量")
    usage_rate: float = Field(..., description="利用率 (%)")
    billed_amount: float = Field(..., description="請求額")
    primary_use_case: str | None = Field(None, description="主な利用目的")


class ServiceUsageResponse(BaseModel):
    """サービス別利用詳細レスポンス。"""

    service_code: str = Field(..., description="サービスコード")
    service_name: str = Field(..., description="サービス名")
    plan_name: str = Field(..., description="プラン名")
    free_tier_limit: int = Field(..., description="無料枠上限")
    overage_unit_price: float = Field(..., description="超過単価")
    usage_details: list[ServiceUsageDetail] = Field(
        ..., description="月次利用詳細のリスト"
    )
