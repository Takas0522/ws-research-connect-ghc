"""メトリクス定義 API エンドポイント。"""

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.metrics_definition import (
    MetricsDefinitionCreate,
    MetricsDefinitionResponse,
    MetricsDefinitionUpdate,
)
from app.services.metrics_definition_service import (
    create_metrics_definition,
    delete_metrics_definition,
    get_metrics_definitions,
    update_metrics_definition,
)

router = APIRouter(prefix="/api", tags=["メトリクス定義"])


@router.get(
    "/products/{product_id}/metrics",
    response_model=list[MetricsDefinitionResponse],
)
async def list_metrics(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """指定製品のメトリクス定義一覧を取得する。"""
    return await get_metrics_definitions(db, product_id)


@router.post(
    "/products/{product_id}/metrics",
    response_model=MetricsDefinitionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_metrics_definition(
    product_id: str,
    data: MetricsDefinitionCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """メトリクス定義を新規作成する。"""
    return await create_metrics_definition(db, product_id, data)


@router.put(
    "/metrics-definitions/{definition_id}",
    response_model=MetricsDefinitionResponse,
)
async def modify_metrics_definition(
    definition_id: str,
    data: MetricsDefinitionUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """メトリクス定義を更新する。"""
    return await update_metrics_definition(db, definition_id, data)


@router.delete(
    "/metrics-definitions/{definition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def deactivate_metrics_definition(
    definition_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> None:
    """メトリクス定義を論理削除する。"""
    await delete_metrics_definition(db, definition_id)
