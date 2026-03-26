"""契約管理エンドポイントのテスト。"""

import pytest
from httpx import AsyncClient


async def _setup_master_data(client: AsyncClient, token: str) -> dict:
    """契約テストに必要なマスターデータを作成する。

    Returns:
        product_id, plan_id, customer_id を含む辞書。
    """
    # 製品作成
    prod_resp = await client.post(
        "/api/products/",
        json={
            "product_code": "PROD-CTR",
            "product_name": "契約テスト製品",
            "category": "SaaS",
            "vendor": "Vendor",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # プラン作成
    plan_resp = await client.post(
        f"/api/products/{product_id}/plans",
        json={
            "plan_code": "PLAN-CTR",
            "plan_name": "契約テストプラン",
            "monthly_base_fee": 5000.0,
            "alert_threshold_pct": 80,
            "metric_limits": [
                {"metric_code": "USERS", "limit_value": 100.0, "overage_unit_price": 50.0}
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert plan_resp.status_code == 201
    plan_id = plan_resp.json()["id"]

    # 顧客作成
    cust_resp = await client.post(
        "/api/customers/",
        json={
            "customer_code": "CUST-CTR",
            "customer_name": "契約テスト顧客",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert cust_resp.status_code == 201
    customer_id = cust_resp.json()["id"]

    return {
        "product_id": product_id,
        "plan_id": plan_id,
        "customer_id": customer_id,
    }


def _contract_payload(master: dict) -> dict:
    """契約作成ペイロードを返す。"""
    return {
        "customer_id": master["customer_id"],
        "product_id": master["product_id"],
        "current_plan_id": master["plan_id"],
        "contract_start_date": "2024-01-01",
        "contract_renewal_date": "2025-01-01",
        "license_count": 10,
        "status": "active",
        "primary_use_case": "sales_ops",
    }


@pytest.mark.anyio
async def test_get_contracts_returns_empty_list(
    test_client: AsyncClient, admin_token: str
) -> None:
    """契約未登録時に空リストを返す。"""
    response = await test_client.get(
        "/api/contracts/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_create_contract_success(
    test_client: AsyncClient, admin_token: str
) -> None:
    """管理者が契約を正常に作成できる。"""
    master = await _setup_master_data(test_client, admin_token)
    payload = _contract_payload(master)
    response = await test_client.post(
        "/api/contracts/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["customer_id"] == master["customer_id"]
    assert body["status"] == "active"
    assert body["license_count"] == 10
    assert body["customer_name"] == "契約テスト顧客"
    assert body["product_name"] == "契約テスト製品"
    assert body["plan_name"] == "契約テストプラン"


@pytest.mark.anyio
async def test_get_contract_by_id(
    test_client: AsyncClient, admin_token: str
) -> None:
    """ID で契約を取得できる。"""
    master = await _setup_master_data(test_client, admin_token)
    create_resp = await test_client.post(
        "/api/contracts/",
        json=_contract_payload(master),
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    contract_id = create_resp.json()["id"]
    response = await test_client.get(
        f"/api/contracts/{contract_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == contract_id


@pytest.mark.anyio
async def test_update_contract_creates_plan_history(
    test_client: AsyncClient, admin_token: str
) -> None:
    """契約のプランまたはライセンス数変更時に履歴が作成される。"""
    master = await _setup_master_data(test_client, admin_token)
    create_resp = await test_client.post(
        "/api/contracts/",
        json=_contract_payload(master),
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    contract_id = create_resp.json()["id"]

    # ライセンス数を変更
    update_resp = await test_client.put(
        f"/api/contracts/{contract_id}",
        json={
            "license_count": 20,
            "change_reason": "ライセンス追加",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["license_count"] == 20

    # 変更履歴を確認（初期作成 + ライセンス変更で 2 件）
    history_resp = await test_client.get(
        f"/api/contracts/{contract_id}/history",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 2


@pytest.mark.anyio
async def test_get_contract_history_initial_entry(
    test_client: AsyncClient, admin_token: str
) -> None:
    """契約作成時に初期プラン履歴が作成される。"""
    master = await _setup_master_data(test_client, admin_token)
    create_resp = await test_client.post(
        "/api/contracts/",
        json=_contract_payload(master),
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    contract_id = create_resp.json()["id"]

    history_resp = await test_client.get(
        f"/api/contracts/{contract_id}/history",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) == 1
    assert history[0]["change_reason"] == "契約作成"
    assert history[0]["license_count_snapshot"] == 10
    assert history[0]["effective_to"] is None


@pytest.mark.anyio
async def test_update_contract_status_transition(
    test_client: AsyncClient, admin_token: str
) -> None:
    """契約ステータスを変更できる。"""
    master = await _setup_master_data(test_client, admin_token)
    create_resp = await test_client.post(
        "/api/contracts/",
        json=_contract_payload(master),
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    contract_id = create_resp.json()["id"]

    response = await test_client.put(
        f"/api/contracts/{contract_id}",
        json={"status": "suspended"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "suspended"


@pytest.mark.anyio
async def test_create_contract_forbidden_for_sales(
    test_client: AsyncClient, admin_token: str, sales_token: str
) -> None:
    """営業ユーザーは契約を作成できない（403）。"""
    master = await _setup_master_data(test_client, admin_token)
    response = await test_client.post(
        "/api/contracts/",
        json=_contract_payload(master),
        headers={"Authorization": f"Bearer {sales_token}"},
    )
    assert response.status_code == 403
