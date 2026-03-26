"""認証エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_login_success_with_correct_credentials(
    test_client: AsyncClient, admin_token: str
) -> None:
    """正しい認証情報でトークンが取得できる。"""
    response = await test_client.post(
        "/api/auth/token",
        data={"username": "admin@test.example.com", "password": "testpassword"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.anyio
async def test_login_failure_with_wrong_password(
    test_client: AsyncClient, admin_token: str
) -> None:
    """誤ったパスワードでログインに失敗する。"""
    response = await test_client.post(
        "/api/auth/token",
        data={"username": "admin@test.example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_login_failure_with_nonexistent_email(
    test_client: AsyncClient,
) -> None:
    """存在しないメールアドレスでログインに失敗する。"""
    response = await test_client.post(
        "/api/auth/token",
        data={"username": "nobody@example.com", "password": "testpassword"},
    )
    assert response.status_code == 401


@pytest.mark.anyio
async def test_me_returns_current_user_with_valid_token(
    test_client: AsyncClient, admin_token: str
) -> None:
    """有効なトークンで現在のユーザー情報を返す。"""
    response = await test_client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "admin@test.example.com"
    assert body["role"] == "admin"


@pytest.mark.anyio
async def test_me_returns_401_without_token(
    test_client: AsyncClient,
) -> None:
    """トークンなしで 401 を返す。"""
    response = await test_client.get("/api/auth/me")
    assert response.status_code == 401
