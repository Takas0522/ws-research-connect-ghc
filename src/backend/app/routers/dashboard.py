"""ダッシュボードエンドポイント。"""

from fastapi import APIRouter, Depends, Query

from app.core.database import get_database
from app.dependencies.auth import get_current_user
from app.schemas.dashboard import (
    LastUpdatedResponse,
    TrendPointResponse,
    UsageAlertResponse,
    UsageSummaryResponse,
    UseCaseSummaryResponse,
)
from app.services.dashboard_service import (
    get_alerts,
    get_last_updated,
    get_trend,
    get_usage_summary,
    get_use_case_summary,
)

router = APIRouter(prefix="/api/dashboard", tags=["ダッシュボード"])


@router.get("/summary", response_model=list[UsageSummaryResponse])
async def dashboard_summary(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """利用量サマリーを取得する。営業ユーザーは担当顧客のみ。"""
    db = get_database()
    return await get_usage_summary(db, current_user)


@router.get("/alerts", response_model=list[UsageAlertResponse])
async def dashboard_alerts(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """閾値超過アラートを取得する。"""
    db = get_database()
    return await get_alerts(db, current_user)


@router.get("/trend", response_model=list[TrendPointResponse])
async def dashboard_trend(
    customer_id: str = Query(..., description="顧客ID"),
    product_id: str = Query(..., description="製品ID"),
    metric_code: str | None = Query(
        None, description="メトリクスコード（省略時は全メトリクス）"
    ),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """直近12ヶ月の利用量トレンドを取得する。"""
    db = get_database()
    return await get_trend(db, customer_id, product_id, metric_code)


@router.get("/use-case-summary", response_model=list[UseCaseSummaryResponse])
async def dashboard_use_case_summary(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """利用目的別サマリーを取得する。"""
    db = get_database()
    return await get_use_case_summary(db, current_user)


@router.get("/last-updated", response_model=LastUpdatedResponse)
async def dashboard_last_updated(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """最終取込確定日時を取得する。"""
    db = get_database()
    last = await get_last_updated(db)
    return {"last_updated": last}
