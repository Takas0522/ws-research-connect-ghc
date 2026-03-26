"""メトリクス定義のスキーマ定義。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MetricsDefinitionCreate(BaseModel):
    """メトリクス定義作成リクエスト。"""

    metric_code: str = Field(
        ..., min_length=1, max_length=50, description="メトリクスコード"
    )
    metric_name: str = Field(
        ..., min_length=1, max_length=200, description="メトリクス表示名"
    )
    unit: str = Field(..., min_length=1, max_length=50, description="単位")
    description: str = Field("", description="説明")


class MetricsDefinitionUpdate(BaseModel):
    """メトリクス定義更新リクエスト。None のフィールドは更新しない。"""

    metric_name: str | None = Field(None, min_length=1, max_length=200)
    unit: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None


class MetricsDefinitionResponse(BaseModel):
    """メトリクス定義レスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    product_id: str
    metric_code: str
    metric_name: str
    unit: str
    description: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
