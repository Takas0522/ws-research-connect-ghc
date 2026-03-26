"""監査ログ関連のスキーマ。"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    """監査ログレスポンス。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(validation_alias="_id")
    actor_user_id: str
    actor_email: str | None = None
    resource_type: str
    resource_id: str
    action: str
    before: dict[str, Any] | None = None
    after: dict[str, Any] | None = None
    created_at: datetime
