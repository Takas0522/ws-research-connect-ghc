"""顧客マスタエンドポイント。"""

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services.customer_service import (
    create_customer,
    delete_customer,
    get_customer,
    get_customers,
    update_customer,
)

router = APIRouter(prefix="/api/customers", tags=["顧客マスタ"])


@router.get("/", response_model=list[CustomerResponse])
async def list_customers(
    current_user: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """有効な全顧客を取得する。"""
    db = get_database()
    return await get_customers(db)


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_endpoint(
    data: CustomerCreate,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """顧客を作成する。"""
    db = get_database()
    return await create_customer(db, data)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(
    customer_id: str,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """顧客を取得する。"""
    db = get_database()
    return await get_customer(db, customer_id)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(
    customer_id: str,
    data: CustomerUpdate,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """顧客を更新する。"""
    db = get_database()
    return await update_customer(db, customer_id, data)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer_endpoint(
    customer_id: str,
    current_user: dict = Depends(get_current_admin_user),
) -> None:
    """顧客を論理削除する。"""
    db = get_database()
    await delete_customer(db, customer_id)
