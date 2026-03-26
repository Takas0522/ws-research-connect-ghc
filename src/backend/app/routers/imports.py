"""データ取込エンドポイント。"""

from fastapi import APIRouter, Depends, UploadFile

from app.core.database import get_database
from app.dependencies.auth import get_current_user
from app.schemas.usage_import import ImportPreviewResponse, UsageImportResponse
from app.services.import_service import (
    confirm_import,
    get_import_history,
    upload_and_validate,
)

router = APIRouter(prefix="/api/imports", tags=["データ取込"])


@router.post("/upload", response_model=ImportPreviewResponse)
async def upload_csv(
    file: UploadFile,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """CSV ファイルをアップロードし、検証結果のプレビューを返す。"""
    db = get_database()
    return await upload_and_validate(db, file, current_user)


@router.post("/{import_id}/confirm", response_model=UsageImportResponse)
async def confirm_import_endpoint(
    import_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """検証済みインポートを確定する。"""
    db = get_database()
    return await confirm_import(db, import_id, current_user)


@router.get("/", response_model=list[UsageImportResponse])
async def list_import_history(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """取込履歴一覧を取得する。"""
    db = get_database()
    return await get_import_history(db)
