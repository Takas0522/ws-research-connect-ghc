"""ポータルサービス起動のビジネスロジック。"""

from datetime import datetime, timezone
from urllib.parse import urlencode

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings

MOCK_LAUNCH_URLS: dict[str, str] = {
    "CONNECT_CHAT": "https://mock.connect-chat.example.com",
    "CONNECT_MEET": "https://mock.connect-meet.example.com",
    "CONNECT_STORE": "https://mock.connect-store.example.com",
}

DEFAULT_MOCK_URL = "https://mock.service.example.com"

DEEPLINK_URLS: dict[str, str] = {
    "CONNECT_CHAT": "connect-chat://launch",
    "CONNECT_MEET": "connect-meet://launch",
    "CONNECT_STORE": "connect-store://launch",
}


async def launch_service(
    db: AsyncIOMotorDatabase, tenant_id: str, user_id: str, service_code: str
) -> dict:
    """サービスを起動する。

    PORTAL_LAUNCH_MODE が "deeplink" の場合はカスタム URL スキームの
    ディープリンク URL を返し、"mock"（デフォルト）の場合は Mock URL を返す。

    Args:
        db: MongoDB データベース。
        tenant_id: テナント ID。
        user_id: ユーザー ID。
        service_code: サービスコード。

    Returns:
        サービス起動レスポンスデータ。

    Raises:
        HTTPException: 契約が見つからない、またはサービスが停止中の場合。
    """
    subscription = await db["portal_subscriptions"].find_one(
        {"tenant_id": ObjectId(tenant_id), "service_code": service_code}
    )
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="契約が見つかりません",
        )

    if subscription["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="サービスが利用できない状態です",
        )

    if settings.PORTAL_LAUNCH_MODE == "deeplink":
        deeplink_base = DEEPLINK_URLS.get(service_code)
        if deeplink_base is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ディープリンクが設定されていないサービスです",
            )
        query = urlencode({"tenant_id": tenant_id, "user_id": user_id})
        deeplink_url = f"{deeplink_base}?{query}"
        return {
            "service_code": service_code,
            "service_name": subscription["service_name"],
            "launch_url": deeplink_url,
            "launched_at": datetime.now(timezone.utc),
            "is_mock": False,
            "deeplink_url": deeplink_url,
        }

    launch_url = MOCK_LAUNCH_URLS.get(service_code, DEFAULT_MOCK_URL)
    return {
        "service_code": service_code,
        "service_name": subscription["service_name"],
        "launch_url": launch_url,
        "launched_at": datetime.now(timezone.utc),
        "is_mock": True,
        "deeplink_url": None,
    }
