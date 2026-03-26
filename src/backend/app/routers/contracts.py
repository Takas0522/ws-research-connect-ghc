"""契約管理エンドポイント。"""

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user, get_current_user
from app.schemas.contract import ContractCreate, ContractResponse, ContractUpdate
from app.schemas.contract_plan_history import ContractPlanHistoryResponse
from app.services.contract_service import (
    create_contract,
    get_contract,
    get_contract_history,
    get_contracts,
    update_contract,
)

router = APIRouter(prefix="/api/contracts", tags=["契約管理"])


@router.get("/", response_model=list[ContractResponse])
async def list_contracts(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """契約一覧を取得する。営業ユーザーは担当顧客の契約のみ取得する。"""
    db = get_database()
    return await get_contracts(db, user=current_user)


@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract_endpoint(
    data: ContractCreate,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """契約を作成する（管理者のみ）。"""
    db = get_database()
    return await create_contract(db, data, current_user)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract_endpoint(
    contract_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """契約を取得する。"""
    db = get_database()
    return await get_contract(db, contract_id)


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract_endpoint(
    contract_id: str,
    data: ContractUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """契約を更新する。営業ユーザーは担当顧客の契約のみ更新可能。"""
    db = get_database()
    return await update_contract(db, contract_id, data, current_user)


@router.get(
    "/{contract_id}/history",
    response_model=list[ContractPlanHistoryResponse],
)
async def get_contract_history_endpoint(
    contract_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """契約のプラン変更履歴を取得する。"""
    db = get_database()
    return await get_contract_history(db, contract_id)
