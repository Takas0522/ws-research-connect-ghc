"""監査ログエンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_audit_logs_admin(
    test_client: AsyncClient, admin_token: str
) -> None:
    """管理者が監査ログを取得できる（初期状態は空リスト）。"""
    response = await test_client.get(
        "/api/audit-logs/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.anyio
async def test_get_audit_logs_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str
) -> None:
    """営業ユーザーは監査ログを取得できない（403）。"""
    response = await test_client.get(
        "/api/audit-logs/",
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_audit_logs_created_on_user_creation(
    test_client: AsyncClient, admin_token: str
) -> None:
    """ユーザー作成時に監査ログが記録される。"""
    # ユーザー作成
    await test_client.post(
        "/api/admin/users/",
        json={
            "email": "audit_test@example.com",
            "display_name": "監査テスト",
            "role": "sales",
            "password": "testpassword",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    # 監査ログに記録があるか確認
    response = await test_client.get(
        "/api/audit-logs/",
        params={"resource_type": "user", "action": "create"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) >= 1
    assert logs[0]["resource_type"] == "user"
    assert logs[0]["action"] == "create"


@pytest.mark.anyio
async def test_audit_logs_filter_by_resource_type(
    test_client: AsyncClient, admin_token: str
) -> None:
    """resource_type でフィルタリングできる。"""
    response = await test_client.get(
        "/api/audit-logs/",
        params={"resource_type": "nonexistent"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []
