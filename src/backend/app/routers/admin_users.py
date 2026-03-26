"""管理者用ユーザー管理エンドポイント。"""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.database import get_database
from app.dependencies.auth import get_current_admin_user
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.audit_service import create_audit_log
from app.services.user_service import (
    create_user,
    deactivate_user,
    get_users,
    update_user,
)

router = APIRouter(
    prefix="/api/admin/users",
    tags=["ユーザー管理"],
)


@router.get("/", response_model=list[UserResponse])
async def list_users(
    current_user: dict = Depends(get_current_admin_user),
) -> list[dict]:
    """全ユーザーを取得する。"""
    db = get_database()
    return await get_users(db)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    data: UserCreate,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """ユーザーを新規作成する。"""
    db = get_database()
    user = await create_user(db, data)
    await create_audit_log(
        db,
        actor_user_id=current_user["_id"],
        resource_type="user",
        resource_id=user["_id"],
        action="create",
        after={
            "email": user["email"],
            "display_name": user["display_name"],
            "role": user["role"],
        },
    )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_existing_user(
    user_id: str,
    data: UserUpdate,
    current_user: dict = Depends(get_current_admin_user),
) -> dict:
    """ユーザーを更新する。"""
    db = get_database()

    # 変更前の状態を取得
    from bson import ObjectId

    before_doc = await db["users"].find_one(
        {"_id": ObjectId(user_id)}, {"password_hash": 0}
    )
    if not before_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )
    before_snapshot = {
        "display_name": before_doc.get("display_name"),
        "role": before_doc.get("role"),
        "is_active": before_doc.get("is_active"),
    }

    user = await update_user(db, user_id, data)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    after_snapshot = {
        "display_name": user.get("display_name"),
        "role": user.get("role"),
        "is_active": user.get("is_active"),
    }
    await create_audit_log(
        db,
        actor_user_id=current_user["_id"],
        resource_type="user",
        resource_id=user_id,
        action="update",
        before=before_snapshot,
        after=after_snapshot,
    )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_existing_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user),
) -> Response:
    """ユーザーを無効化する。"""
    db = get_database()
    user = await deactivate_user(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )
    await create_audit_log(
        db,
        actor_user_id=current_user["_id"],
        resource_type="user",
        resource_id=user_id,
        action="deactivate",
        before={"is_active": True},
        after={"is_active": False},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
