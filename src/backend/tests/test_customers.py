"""顧客マスタ CRUD エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient

CUSTOMER_DATA = {
    "customer_code": "CUST-001",
    "customer_name": "テスト顧客株式会社",
    "contact_person": "田中太郎",
    "notes": "テスト用ノート",
}


async def _create_customer(
    client: AsyncClient, token: str, data: dict | None = None
) -> dict:
    """テスト用顧客を作成するヘルパー。"""
    payload = data or CUSTOMER_DATA
    resp = await client.post(
        "/api/customers/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.anyio
async def test_get_customers_returns_empty_list(
    test_client: AsyncClient, admin_token: str
) -> None:
    """顧客未登録時に空リストを返す。"""
    response = await test_client.get(
        "/api/customers/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_customer_success(
    test_client: AsyncClient, admin_token: str
) -> None:
    """顧客を正常に作成できる。"""
    body = await _create_customer(test_client, admin_token)
    assert body["customer_code"] == "CUST-001"
    assert body["customer_name"] == "テスト顧客株式会社"
    assert body["is_active"] is True


@pytest.mark.anyio
async def test_get_customer_by_id(test_client: AsyncClient, admin_token: str) -> None:
    """ID で顧客を取得できる。"""
    created = await _create_customer(test_client, admin_token)
    response = await test_client.get(
        f"/api/customers/{created['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["customer_code"] == "CUST-001"


@pytest.mark.anyio
async def test_update_customer(test_client: AsyncClient, admin_token: str) -> None:
    """顧客情報を更新できる。"""
    created = await _create_customer(test_client, admin_token)
    response = await test_client.put(
        f"/api/customers/{created['id']}",
        json={"customer_name": "更新済み顧客"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["customer_name"] == "更新済み顧客"


@pytest.mark.anyio
async def test_delete_customer(test_client: AsyncClient, admin_token: str) -> None:
    """顧客を論理削除できる。"""
    created = await _create_customer(test_client, admin_token)
    response = await test_client.delete(
        f"/api/customers/{created['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204

    # 削除後はリストに含まれない
    response = await test_client.get(
        "/api/customers/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert len(response.json()) == 0


@pytest.mark.anyio
async def test_create_customer_duplicate_code_returns_409(
    test_client: AsyncClient, admin_token: str
) -> None:
    """重複する customer_code で 409 エラーを返す。"""
    await _create_customer(test_client, admin_token)
    response = await test_client.post(
        "/api/customers/",
        json=CUSTOMER_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_create_customer_with_sales_assignment(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """assigned_sales_user_id を指定して顧客を作成できる。"""
    # 営業ユーザーの ID を取得
    sales_user = await test_db["users"].find_one({"role": "sales"})
    # admin_token fixture だけ使っている場合、sales ユーザーがいない可能性がある
    # テスト DB に直接 sales ユーザーを確認するか作成
    if sales_user is None:
        from app.core.security import hash_password
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        result = await test_db["users"].insert_one(
            {
                "email": "sales_assign@test.example.com",
                "password_hash": hash_password("testpassword"),
                "display_name": "営業担当",
                "role": "sales",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        )
        sales_user_id = str(result.inserted_id)
    else:
        sales_user_id = str(sales_user["_id"])

    data = {
        **CUSTOMER_DATA,
        "customer_code": "CUST-ASSIGN",
        "assigned_sales_user_id": sales_user_id,
    }
    body = await _create_customer(test_client, admin_token, data)
    assert body["assigned_sales_user_id"] == sales_user_id


@pytest.mark.anyio
async def test_create_customer_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str
) -> None:
    """営業ユーザーは顧客を作成できない（403）。"""
    response = await test_client.post(
        "/api/customers/",
        json=CUSTOMER_DATA,
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
