"""データ取込エンドポイントのテスト。"""

import io

import pytest
from httpx import AsyncClient


async def _setup_import_data(client: AsyncClient, token: str, test_db) -> dict:
    """取込テストに必要なマスターデータと契約を作成する。

    Returns:
        product_id, plan_id, customer_id, contract_id, product_code, customer_code を含む辞書。
    """
    # 製品作成
    prod_resp = await client.post(
        "/api/products/",
        json={
            "product_code": "PROD-IMP",
            "product_name": "取込テスト製品",
            "category": "SaaS",
            "vendor": "Vendor",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # メトリクス定義作成
    await client.post(
        f"/api/products/{product_id}/metrics",
        json={
            "metric_code": "API_CALLS",
            "metric_name": "API コール数",
            "unit": "calls",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # プラン作成（metric_limits に API_CALLS を含める）
    plan_resp = await client.post(
        f"/api/products/{product_id}/plans",
        json={
            "plan_code": "PLAN-IMP",
            "plan_name": "取込テストプラン",
            "monthly_base_fee": 5000.0,
            "alert_threshold_pct": 80,
            "metric_limits": [
                {
                    "metric_code": "API_CALLS",
                    "limit_value": 1000.0,
                    "overage_unit_price": 10.0,
                }
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
            "customer_code": "CUST-IMP",
            "customer_name": "取込テスト顧客",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert cust_resp.status_code == 201
    customer_id = cust_resp.json()["id"]

    # 契約作成
    contract_resp = await client.post(
        "/api/contracts/",
        json={
            "customer_id": customer_id,
            "product_id": product_id,
            "current_plan_id": plan_id,
            "contract_start_date": "2024-01-01",
            "contract_renewal_date": "2025-01-01",
            "license_count": 5,
            "status": "active",
            "primary_use_case": "analytics",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert contract_resp.status_code == 201
    contract_id = contract_resp.json()["id"]

    return {
        "product_id": product_id,
        "plan_id": plan_id,
        "customer_id": customer_id,
        "contract_id": contract_id,
        "product_code": "PROD-IMP",
        "customer_code": "CUST-IMP",
    }


def _make_csv(rows: list[list[str]]) -> bytes:
    """CSV バイト列を生成する。"""
    header = "customer_code,product_code,billing_month,metric_code,actual_value"
    lines = [header] + [",".join(r) for r in rows]
    return "\n".join(lines).encode("utf-8")


@pytest.mark.anyio
async def test_upload_csv_valid_data(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """有効な CSV をアップロードして検証プレビューを取得できる。"""
    master = await _setup_import_data(test_client, admin_token, test_db)
    csv_data = _make_csv(
        [
            [
                master["customer_code"],
                master["product_code"],
                "2024-06",
                "API_CALLS",
                "500",
            ]
        ]
    )
    response = await test_client.post(
        "/api/imports/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "validated"
    assert body["record_count"] == 1
    assert body["error_count"] == 0
    assert body["billing_month"] == "2024-06"
    assert len(body["records"]) == 1
    assert body["records"][0]["status"] == "ok"


@pytest.mark.anyio
async def test_upload_csv_invalid_customer_code(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """存在しない customer_code でエラーレコードが返される。"""
    await _setup_import_data(test_client, admin_token, test_db)
    csv_data = _make_csv([["UNKNOWN_CUST", "PROD-IMP", "2024-06", "API_CALLS", "500"]])
    response = await test_client.post(
        "/api/imports/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["error_count"] == 1
    assert body["records"][0]["status"] == "error"


@pytest.mark.anyio
async def test_confirm_import_success(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """検証済みインポートを確定できる。"""
    master = await _setup_import_data(test_client, admin_token, test_db)
    csv_data = _make_csv(
        [
            [
                master["customer_code"],
                master["product_code"],
                "2024-06",
                "API_CALLS",
                "500",
            ]
        ]
    )
    upload_resp = await test_client.post(
        "/api/imports/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    import_id = upload_resp.json()["import_id"]

    # 確定
    confirm_resp = await test_client.post(
        f"/api/imports/{import_id}/confirm",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert confirm_resp.status_code == 200
    body = confirm_resp.json()
    assert body["status"] == "confirmed"
    assert body["confirmed_at"] is not None

    # monthly_usage に挿入されたか確認
    usage_count = await test_db["monthly_usage"].count_documents({})
    assert usage_count == 1


@pytest.mark.anyio
async def test_get_import_history(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """取込履歴一覧を取得できる。"""
    master = await _setup_import_data(test_client, admin_token, test_db)
    csv_data = _make_csv(
        [
            [
                master["customer_code"],
                master["product_code"],
                "2024-06",
                "API_CALLS",
                "300",
            ]
        ]
    )
    await test_client.post(
        "/api/imports/upload",
        files={"file": ("test.csv", io.BytesIO(csv_data), "text/csv")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await test_client.get(
        "/api/imports/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 1
    assert history[0]["billing_month"] == "2024-06"


@pytest.mark.anyio
async def test_upload_csv_missing_headers(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """必須ヘッダーが欠如した CSV で 400 エラーを返す。"""
    csv_data = b"customer_code,product_code\nCUST-001,PROD-001"
    response = await test_client.post(
        "/api/imports/upload",
        files={"file": ("bad.csv", io.BytesIO(csv_data), "text/csv")},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400
