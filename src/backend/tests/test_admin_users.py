"""ユーザー管理エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


USER_CREATE_DATA = {
    "email": "newuser@example.com",
    "display_name": "新規ユーザー",
    "role": "sales",
    "password": "securepassword",
}


@pytest.mark.anyio
async def test_list_users_admin(test_client: AsyncClient, admin_token: str) -> None:
    """管理者がユーザー一覧を取得できる。"""
    response = await test_client.get(
        "/api/admin/users/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    users = response.json()
    # admin_token fixture がユーザーを作成済み
    assert len(users) >= 1


@pytest.mark.anyio
async def test_create_user_admin(test_client: AsyncClient, admin_token: str) -> None:
    """管理者がユーザーを作成できる。"""
    response = await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "newuser@example.com"
    assert body["role"] == "sales"
    assert body["is_active"] is True


@pytest.mark.anyio
async def test_create_user_duplicate_email_returns_409(
    test_client: AsyncClient, admin_token: str
) -> None:
    """重複メールアドレスで 409 エラーを返す。"""
    await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_update_user(test_client: AsyncClient, admin_token: str) -> None:
    """管理者がユーザーを更新できる。"""
    create_resp = await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    user_id = create_resp.json()["id"]
    response = await test_client.put(
        f"/api/admin/users/{user_id}",
        json={"display_name": "更新済みユーザー", "role": "admin"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "更新済みユーザー"
    assert body["role"] == "admin"


@pytest.mark.anyio
async def test_delete_user_deactivates(
    test_client: AsyncClient, admin_token: str
) -> None:
    """管理者がユーザーを無効化できる。"""
    create_resp = await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    user_id = create_resp.json()["id"]
    response = await test_client.delete(
        f"/api/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204


@pytest.mark.anyio
async def test_list_users_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str
) -> None:
    """営業ユーザーはユーザー一覧を取得できない（403）。"""
    response = await test_client.get(
        "/api/admin/users/",
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_create_user_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str
) -> None:
    """営業ユーザーはユーザーを作成できない（403）。"""
    response = await test_client.post(
        "/api/admin/users/",
        json=USER_CREATE_DATA,
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
