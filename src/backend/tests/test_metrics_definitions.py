"""メトリクス定義 CRUD エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


async def _create_product(client: AsyncClient, token: str) -> str:
    """テスト用製品を作成し ID を返す。"""
    resp = await client.post(
        "/api/products/",
        json={
            "product_code": "PROD-M01",
            "product_name": "メトリクステスト製品",
            "category": "SaaS",
            "vendor": "Vendor",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


METRIC_DATA = {
    "metric_code": "API_CALLS",
    "metric_name": "API コール数",
    "unit": "calls",
    "description": "月間 API コール数",
}


@pytest.mark.anyio
async def test_get_metrics_empty(
    test_client: AsyncClient, admin_token: str
) -> None:
    """メトリクス未登録時に空リストを返す。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.get(
        f"/api/products/{product_id}/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_metrics_definition_success(
    test_client: AsyncClient, admin_token: str
) -> None:
    """メトリクス定義を正常に作成できる。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["metric_code"] == "API_CALLS"
    assert body["product_id"] == product_id
    assert body["is_active"] is True


@pytest.mark.anyio
async def test_get_metrics_returns_created(
    test_client: AsyncClient, admin_token: str
) -> None:
    """作成後にリストに含まれる。"""
    product_id = await _create_product(test_client, admin_token)
    await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = await test_client.get(
        f"/api/products/{product_id}/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    metrics = response.json()
    assert len(metrics) == 1
    assert metrics[0]["metric_code"] == "API_CALLS"


@pytest.mark.anyio
async def test_update_metrics_definition(
    test_client: AsyncClient, admin_token: str
) -> None:
    """メトリクス定義を更新できる。"""
    product_id = await _create_product(test_client, admin_token)
    create_resp = await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    definition_id = create_resp.json()["id"]
    response = await test_client.put(
        f"/api/metrics-definitions/{definition_id}",
        json={"metric_name": "更新済みメトリクス"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["metric_name"] == "更新済みメトリクス"


@pytest.mark.anyio
async def test_delete_metrics_definition(
    test_client: AsyncClient, admin_token: str
) -> None:
    """メトリクス定義を論理削除できる。"""
    product_id = await _create_product(test_client, admin_token)
    create_resp = await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    definition_id = create_resp.json()["id"]
    response = await test_client.delete(
        f"/api/metrics-definitions/{definition_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204

    # 削除後はリストに含まれない
    response = await test_client.get(
        f"/api/products/{product_id}/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert len(response.json()) == 0


@pytest.mark.anyio
async def test_create_duplicate_metric_code_returns_409(
    test_client: AsyncClient, admin_token: str
) -> None:
    """同一製品内で重複する metric_code で 409 を返す。"""
    product_id = await _create_product(test_client, admin_token)
    await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    response = await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 409


@pytest.mark.anyio
async def test_create_metrics_forbidden_for_sales(
    test_client: AsyncClient, sales_token: str, admin_token: str
) -> None:
    """営業ユーザーはメトリクスを作成できない（403）。"""
    product_id = await _create_product(test_client, admin_token)
    response = await test_client.post(
        f"/api/products/{product_id}/metrics",
        json=METRIC_DATA,
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
