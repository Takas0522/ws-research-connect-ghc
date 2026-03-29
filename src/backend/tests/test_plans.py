"""プランマスタ CRUD エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


async def _create_product(client: AsyncClient, token: str) -> str:
    """テスト用製品を作成し ID を返す。"""
    resp = await client.post(
        "/api/products/",
        json={
            "product_code": "PROD-PL01",
            "product_name": "プランテスト製品",
            "category": "SaaS",
            "vendor": "Vendor",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


PLAN_DATA = {
    "plan_code": "PLAN-001",
    "plan_name": "スタンダードプラン",
    "monthly_base_fee": 10000.0,
    "alert_threshold_pct": 80,
    "metric_limits": [
        {
            "metric_code": "API_CALLS",
            "limit_value": 1000.0,
            "overage_unit_price": 10.0,
        }
    ],
}


@pytest.mark.anyio
async def test_get_plans_empty(test_client: AsyncClient, admin_token: str) -> None:
    """プラン未登録時に空リストを返す。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.get(
        f"/api/products/{product_id}/plans",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_plan_success(test_client: AsyncClient, admin_token: str) -> None:
    """プランを正常に作成できる。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["plan_code"] == "PLAN-001"
    assert body["product_id"] == product_id
    assert body["monthly_base_fee"] == 10000.0
    assert len(body["metric_limits"]) == 1
    assert body["metric_limits"][0]["metric_code"] == "API_CALLS"


@pytest.mark.anyio
async def test_get_plan_by_id(test_client: AsyncClient, admin_token: str) -> None:
    """ID でプランを取得できる。"""
    product_id = await _create_product(test_client, admin_token)
    create_resp = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_resp.json()["id"]
    response = await test_client.get(
        f"/api/plans/{plan_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["plan_code"] == "PLAN-001"


@pytest.mark.anyio
async def test_update_plan(test_client: AsyncClient, admin_token: str) -> None:
    """プランを更新できる。"""
    product_id = await _create_product(test_client, admin_token)
    create_resp = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_resp.json()["id"]
    response = await test_client.put(
        f"/api/plans/{plan_id}",
        json={"plan_name": "プレミアムプラン", "monthly_base_fee": 20000.0},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["plan_name"] == "プレミアムプラン"
    assert body["monthly_base_fee"] == 20000.0


@pytest.mark.anyio
async def test_delete_plan(test_client: AsyncClient, admin_token: str) -> None:
    """プランを論理削除できる。"""
    product_id = await _create_product(test_client, admin_token)
    create_resp = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    plan_id = create_resp.json()["id"]
    response = await test_client.delete(
        f"/api/plans/{plan_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204

    # 削除後はリストに含まれない
    response = await test_client.get(
        f"/api/products/{product_id}/plans",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert len(response.json()) == 0


@pytest.mark.anyio
async def test_create_duplicate_plan_code_returns_409(
    test_client: AsyncClient, admin_token: str
) -> None:
    """重複する plan_code で 409 エラーを返す。"""
    product_id = await _create_product(test_client, admin_token)
    await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_create_plan_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str, admin_token: str
) -> None:
    """営業ユーザーはプランを作成できない（403）。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.post(
        f"/api/products/{product_id}/plans",
        json=PLAN_DATA,
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
