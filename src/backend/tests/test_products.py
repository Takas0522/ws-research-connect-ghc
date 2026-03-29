"""製品マスタ CRUD エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient

PRODUCT_DATA = {
    "product_code": "PROD-001",
    "product_name": "テスト製品",
    "category": "SaaS",
    "vendor": "テストベンダー",
}


async def _create_product(
    client: AsyncClient, token: str, data: dict | None = None
) -> dict:
    """テスト用製品を作成し、レスポンスを返すヘルパー。"""
    payload = data or PRODUCT_DATA
    resp = await client.post(
        "/api/products/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.anyio
async def test_get_products_returns_empty_list_when_no_products(
    test_client: AsyncClient, admin_token: str
) -> None:
    """製品未登録時に空リストを返す。"""
    response = await test_client.get(
        "/api/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_product_success(
    test_client: AsyncClient, admin_token: str
) -> None:
    """管理者が製品を正常に作成できる。"""
    body = await _create_product(test_client, admin_token)
    assert body["product_code"] == PRODUCT_DATA["product_code"]
    assert body["product_name"] == PRODUCT_DATA["product_name"]
    assert body["is_active"] is True
    assert "id" in body


@pytest.mark.anyio
async def test_get_products_returns_products_after_creation(
    test_client: AsyncClient, admin_token: str
) -> None:
    """製品作成後にリストに含まれる。"""
    await _create_product(test_client, admin_token)
    response = await test_client.get(
        "/api/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    products = response.json()
    assert len(products) == 1
    assert products[0]["product_code"] == PRODUCT_DATA["product_code"]


@pytest.mark.anyio
async def test_get_product_by_id(test_client: AsyncClient, admin_token: str) -> None:
    """ID で製品を取得できる。"""
    created = await _create_product(test_client, admin_token)
    product_id = created["id"]
    response = await test_client.get(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["product_code"] == PRODUCT_DATA["product_code"]


@pytest.mark.anyio
async def test_update_product(test_client: AsyncClient, admin_token: str) -> None:
    """管理者が製品を更新できる。"""
    created = await _create_product(test_client, admin_token)
    product_id = created["id"]
    response = await test_client.put(
        f"/api/products/{product_id}",
        json={"product_name": "更新済み製品"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["product_name"] == "更新済み製品"


@pytest.mark.anyio
async def test_delete_product(test_client: AsyncClient, admin_token: str) -> None:
    """管理者が製品を論理削除できる。"""
    created = await _create_product(test_client, admin_token)
    product_id = created["id"]
    response = await test_client.delete(
        f"/api/products/{product_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204

    # 削除後は一覧に含まれない
    response = await test_client.get(
        "/api/products/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert len(response.json()) == 0


@pytest.mark.anyio
async def test_create_product_duplicate_code_returns_409(
    test_client: AsyncClient, admin_token: str
) -> None:
    """重複する product_code で 409 エラーを返す。"""
    await _create_product(test_client, admin_token)
    response = await test_client.post(
        "/api/products/",
        json=PRODUCT_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_create_product_forbidden_for_sales_role(
    test_client: AsyncClient, sales_token: str
) -> None:
    """営業ユーザーは製品を作成できない（403）。"""
    response = await test_client.post(
        "/api/products/",
        json=PRODUCT_DATA,
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
