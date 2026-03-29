"""ポータルサービス起動関連のスキーマ。"""

from datetime import datetime

from pydantic import BaseModel, Field


class ServiceLaunchResponse(BaseModel):
    """サービス起動レスポンス。"""

    service_code: str = Field(..., description="サービスコード")
    service_name: str = Field(..., description="サービス名")
    launch_url: str = Field(..., description="起動 URL")
    launched_at: datetime = Field(..., description="起動日時")
    is_mock: bool = Field(..., description="Mock 起動かどうか")
    deeplink_url: str | None = Field(None, description="ディープリンク URL")
