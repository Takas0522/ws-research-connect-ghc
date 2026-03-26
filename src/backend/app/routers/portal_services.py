"""ポータルサービス一覧・利用詳細・起動のルーター。"""

from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.dependencies.portal_auth import PortalUser, get_current_portal_user
from app.schemas.portal_service_launch import ServiceLaunchResponse
from app.schemas.portal_subscription import SubscriptionListResponse
from app.schemas.portal_usage import ServiceUsageResponse
from app.services.portal_service_launch_service import launch_service
from app.services.portal_subscription_service import (
    get_service_usage,
    get_subscriptions,
)

router = APIRouter(prefix="/api/portal/services", tags=["Portal Services"])


@router.get("", response_model=SubscriptionListResponse)
async def list_subscriptions(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> SubscriptionListResponse:
    """テナントの契約サービス一覧を取得する。"""
    db = get_database()
    data = await get_subscriptions(db, current_user.tenant_id)
    return SubscriptionListResponse(**data)


@router.get("/{service_code}/usage", response_model=ServiceUsageResponse)
async def get_usage_detail(
    service_code: str,
    current_user: PortalUser = Depends(get_current_portal_user),
) -> ServiceUsageResponse:
    """サービス別の月次利用詳細を取得する。"""
    db = get_database()
    data = await get_service_usage(db, current_user.tenant_id, service_code)
    return ServiceUsageResponse(**data)


@router.post("/{service_code}/launch", response_model=ServiceLaunchResponse)
async def launch(
    service_code: str,
    current_user: PortalUser = Depends(get_current_portal_user),
) -> ServiceLaunchResponse:
    """サービスを起動する。"""
    db = get_database()
    data = await launch_service(
        db, current_user.tenant_id, current_user.id, service_code
    )
    return ServiceLaunchResponse(**data)
