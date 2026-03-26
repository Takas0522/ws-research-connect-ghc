"""監査ログエンドポイント。"""

from fastapi import APIRouter, Depends, Query

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import get_audit_logs

router = APIRouter(
    prefix="/api/audit-logs",
    tags=["監査ログ"],
)


@router.get("/", response_model=list[AuditLogResponse])
async def list_audit_logs(
    resource_type: str | None = Query(None, description="リソース種類フィルタ"),
    action: str | None = Query(None, description="操作種類フィルタ"),
    limit: int = Query(100, ge=1, le=1000, description="取得件数"),
    skip: int = Query(0, ge=0, description="スキップ件数"),
    current_user: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """監査ログを取得する。"""
    db = get_database()
    return await get_audit_logs(
        db,
        resource_type=resource_type,
        action=action,
        limit=limit,
        skip=skip,
    )
