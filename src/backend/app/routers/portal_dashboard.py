"""ポータルダッシュボード API エンドポイント。"""

from fastapi import APIRouter, Depends, Query

from app.core.database import get_database
from app.dependencies.portal_auth import PortalUser, get_current_portal_user
from app.schemas.portal_dashboard import (
    DashboardSummaryResponse,
    UsageByPurposeResponse,
    UsageTrendResponse,
)
from app.services.portal_dashboard_service import (
    get_dashboard_summary,
    get_usage_by_purpose,
    get_usage_trends,
)

router = APIRouter(prefix="/api/portal/dashboard", tags=["Portal Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> DashboardSummaryResponse:
    """テナントの利用状況サマリーを取得する。

    Args:
        current_user: 認証済みポータルユーザー。

    Returns:
        テナント名・契約サービス数・合計請求額・サービス別利用状況。
    """
    db = get_database()
    data = await get_dashboard_summary(db, current_user.tenant_id)
    return DashboardSummaryResponse(**data)


@router.get("/trends", response_model=UsageTrendResponse)
async def dashboard_trends(
    months: int = Query(12, ge=1, le=36, description="取得する月数"),
    current_user: PortalUser = Depends(get_current_portal_user),
) -> UsageTrendResponse:
    """月次利用推移データを取得する。

    Args:
        months: 取得する月数（デフォルト 12、最大 36）。
        current_user: 認証済みポータルユーザー。

    Returns:
        サービス別の月次利用量・請求額の推移。
    """
    db = get_database()
    data = await get_usage_trends(db, current_user.tenant_id, months)
    return UsageTrendResponse(**data)


@router.get("/usage-by-purpose", response_model=UsageByPurposeResponse)
async def dashboard_usage_by_purpose(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> UsageByPurposeResponse:
    """利用目的別の集計データを取得する。

    Args:
        current_user: 認証済みポータルユーザー。

    Returns:
        利用目的ごとの件数・合計利用量。
    """
    db = get_database()
    data = await get_usage_by_purpose(db, current_user.tenant_id)
    return UsageByPurposeResponse(**data)
