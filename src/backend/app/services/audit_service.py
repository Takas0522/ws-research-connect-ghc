"""監査ログサービス — 監査ログの記録・取得。"""

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

AUDIT_LOGS_COLLECTION = "audit_logs"
USERS_COLLECTION = "users"


async def create_audit_log(
    db: AsyncIOMotorDatabase,
    actor_user_id: str,
    resource_type: str,
    resource_id: str,
    action: str,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> str:
    """監査ログを作成する。

    Args:
        db: MongoDB データベースインスタンス。
        actor_user_id: 操作を行ったユーザーの ID。
        resource_type: 対象リソースの種類。
        resource_id: 対象リソースの ID。
        action: 実行した操作。
        before: 変更前の状態。
        after: 変更後の状態。

    Returns:
        作成された監査ログの ID。
    """
    now = datetime.now(timezone.utc)
    doc = {
        "actor_user_id": actor_user_id,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "action": action,
        "before": before,
        "after": after,
        "created_at": now,
    }
    result = await db[AUDIT_LOGS_COLLECTION].insert_one(doc)
    return str(result.inserted_id)


async def get_audit_logs(
    db: AsyncIOMotorDatabase,
    resource_type: str | None = None,
    action: str | None = None,
    limit: int = 100,
    skip: int = 0,
) -> list[dict]:
    """監査ログを取得する（actor_email を結合）。

    Args:
        db: MongoDB データベースインスタンス。
        resource_type: フィルタ — リソース種類。
        action: フィルタ — 操作種類。
        limit: 取得件数上限。
        skip: スキップ件数。

    Returns:
        監査ログドキュメントのリスト。
    """
    query: dict[str, Any] = {}
    if resource_type:
        query["resource_type"] = resource_type
    if action:
        query["action"] = action

    cursor = (
        db[AUDIT_LOGS_COLLECTION]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    logs = await cursor.to_list(length=limit)

    # actor_user_id から actor_email を取得
    actor_ids = {log["actor_user_id"] for log in logs}
    email_map: dict[str, str] = {}
    if actor_ids:
        from bson import ObjectId

        object_ids = []
        for aid in actor_ids:
            try:
                object_ids.append(ObjectId(aid))
            except Exception:
                pass
        if object_ids:
            users_cursor = db[USERS_COLLECTION].find(
                {"_id": {"$in": object_ids}}, {"email": 1}
            )
            users = await users_cursor.to_list(length=len(object_ids))
            for u in users:
                email_map[str(u["_id"])] = u["email"]

    for log in logs:
        log["_id"] = str(log["_id"])
        log["actor_email"] = email_map.get(log["actor_user_id"])

    return logs
