"""Motor 非同期 MongoDB クライアント管理。"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_database() -> AsyncIOMotorDatabase:
    """現在の MongoDB データベースインスタンスを返す。"""
    if _client is None:
        raise RuntimeError(
            "Database client is not initialized. Call connect_db() first."
        )
    return _client[settings.DATABASE_NAME]


async def connect_db() -> None:
    """MongoDB クライアントを初期化する。"""
    global _client
    _client = AsyncIOMotorClient(settings.MONGO_URI)


async def close_db() -> None:
    """MongoDB クライアントを切断する。"""
    global _client
    if _client is not None:
        _client.close()
        _client = None
