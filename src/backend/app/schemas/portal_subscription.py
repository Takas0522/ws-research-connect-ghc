"""ポータル契約サービス関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubscriptionResponse(BaseModel):
    """契約サービスレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id", description="サブスクリプション ID")
    service_code: str = Field(..., description="サービスコード")
    service_name: str = Field(..., description="サービス名")
    plan_name: str = Field(..., description="プラン名")
    status: str = Field(..., description="ステータス (active | suspended | terminated)")
    base_price: float = Field(..., description="基本料金")
    contract_start_date: datetime = Field(..., description="契約開始日")
    contract_end_date: datetime | None = Field(None, description="契約終了日")


class SubscriptionListResponse(BaseModel):
    """契約サービス一覧レスポンス。"""

    subscriptions: list[SubscriptionResponse] = Field(
        ..., description="契約サービスのリスト"
    )
    total_count: int = Field(..., description="合計件数")
