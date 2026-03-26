"""プランマスタ API エンドポイント。"""

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate
from app.services.plan_service import (
    create_plan,
    delete_plan,
    get_plan,
    get_plans,
    update_plan,
)

router = APIRouter(prefix="/api", tags=["プランマスタ"])


@router.get("/products/{product_id}/plans", response_model=list[PlanResponse])
async def list_plans(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """指定された製品のプラン一覧を取得する。"""
    return await get_plans(db, product_id)


@router.post(
    "/products/{product_id}/plans",
    response_model=PlanResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_plan(
    product_id: str,
    data: PlanCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """プランを新規作成する。"""
    return await create_plan(db, product_id, data)


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def read_plan(
    plan_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """プランを取得する。"""
    return await get_plan(db, plan_id)


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def modify_plan(
    plan_id: str,
    data: PlanUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """プランを更新する。"""
    return await update_plan(db, plan_id, data)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_plan(
    plan_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> None:
    """プランを論理削除する。"""
    await delete_plan(db, plan_id)
