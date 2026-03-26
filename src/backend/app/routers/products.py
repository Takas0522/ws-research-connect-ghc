"""製品マスタ API エンドポイント。"""

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import (
    create_product,
    delete_product,
    get_product,
    get_products,
    update_product,
)

router = APIRouter(prefix="/api/products", tags=["製品マスタ"])


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """全製品を取得する。"""
    return await get_products(db)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(
    data: ProductCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """製品を新規作成する。"""
    return await create_product(db, data)


@router.get("/{product_id}", response_model=ProductResponse)
async def read_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """製品を取得する。"""
    return await get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
async def modify_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> dict:
    """製品を更新する。"""
    return await update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    _: dict = Depends(get_current_admin_user),
) -> None:
    """製品を論理削除する。"""
    await delete_product(db, product_id)
