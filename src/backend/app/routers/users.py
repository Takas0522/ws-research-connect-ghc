"""ユーザーエンドポイント。"""

from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user

router = APIRouter(prefix="/api/users", tags=["ユーザー"])


@router.get("/sales")
async def list_sales_users(
    current_user: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """有効な営業ユーザーの一覧を返す。"""
    db = get_database()
    cursor = db["users"].find(
        {"role": "sales", "is_active": True}, {"password_hash": 0}
    )
    users = await cursor.to_list(length=100)
    for u in users:
        u["_id"] = str(u["_id"])
    return users
