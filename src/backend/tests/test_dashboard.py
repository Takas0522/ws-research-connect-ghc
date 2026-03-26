"""ダッシュボードエンドポイントのテスト。"""

import io
from datetime import datetime, timezone

import pytest
from bson import ObjectId
from httpx import AsyncClient


async def _setup_dashboard_data(client: AsyncClient, token: str, test_db) -> dict:
    """ダッシュボードテスト用のマスターデータ＋利用データを作成する。"""
    # 現在月を使用（トレンドは直近12ヶ月を参照するため）
    from dateutil.relativedelta import relativedelta

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    last_month = (datetime.now(timezone.utc) - relativedelta(months=1)).strftime("%Y-%m")
    # 製品作成
    prod_resp = await client.post(
        "/api/products/",
        json={
            "product_code": "PROD-DASH",
            "product_name": "ダッシュボード製品",
            "category": "SaaS",
            "vendor": "Vendor",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    product_id = prod_resp.json()["id"]

    # メトリクス定義
    await client.post(
        f"/api/products/{product_id}/metrics",
        json={
            "metric_code": "STORAGE",
            "metric_name": "ストレージ",
            "unit": "GB",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # プラン作成
    plan_resp = await client.post(
        f"/api/products/{product_id}/plans",
        json={
            "plan_code": "PLAN-DASH",
            "plan_name": "ダッシュボードプラン",
            "monthly_base_fee": 3000.0,
            "alert_threshold_pct": 80,
            "metric_limits": [
                {"metric_code": "STORAGE", "limit_value": 100.0, "overage_unit_price": 5.0}
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    plan_id = plan_resp.json()["id"]

    # 顧客作成
    cust_resp = await client.post(
        "/api/customers/",
        json={
            "customer_code": "CUST-DASH",
            "customer_name": "ダッシュボード顧客",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
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
    contract_id = contract_resp.json()["id"]

    # monthly_usage データを直接投入（前月データ）
    now = datetime.now(timezone.utc)
    await test_db["monthly_usage"].insert_one(
        {
            "contract_id": contract_id,
            "customer_id": customer_id,
            "product_id": product_id,
            "billing_month": last_month,
            "metric_code": "STORAGE",
            "actual_value": 90.0,
            "limit_value_snapshot": 100.0,
            "usage_rate": 90.0,
            "overage_count": 0.0,
            "overage_fee": 0.0,
            "import_id": str(ObjectId()),
            "imported_at": now,
        }
    )

    return {
        "product_id": product_id,
        "customer_id": customer_id,
        "contract_id": contract_id,
        "plan_id": plan_id,
        "billing_month": last_month,
    }


@pytest.mark.anyio
async def test_dashboard_summary(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """利用量サマリーを取得できる。"""
    await _setup_dashboard_data(test_client, admin_token, test_db)
    response = await test_client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    summaries = response.json()
    assert len(summaries) >= 1
    assert summaries[0]["customer_name"] == "ダッシュボード顧客"
    assert len(summaries[0]["metrics"]) >= 1


@pytest.mark.anyio
async def test_dashboard_alerts(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """閾値超過アラートを取得できる（usage_rate=90 >= threshold=80）。"""
    await _setup_dashboard_data(test_client, admin_token, test_db)
    response = await test_client.get(
        "/api/dashboard/alerts",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) >= 1
    assert alerts[0]["usage_rate"] >= 80


@pytest.mark.anyio
async def test_dashboard_trend(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """月次トレンドを取得できる。"""
    data = await _setup_dashboard_data(test_client, admin_token, test_db)
    response = await test_client.get(
        "/api/dashboard/trend",
        params={
            "customer_id": data["customer_id"],
            "product_id": data["product_id"],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    trend = response.json()
    assert len(trend) >= 1
    # 12ヶ月分 x メトリクス数
    assert any(p["metric_code"] == "STORAGE" for p in trend)


@pytest.mark.anyio
async def test_dashboard_use_case_summary(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """利用目的別契約件数を取得できる。"""
    await _setup_dashboard_data(test_client, admin_token, test_db)
    response = await test_client.get(
        "/api/dashboard/use-case-summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    summaries = response.json()
    assert len(summaries) >= 1
    analytics = [s for s in summaries if s["use_case"] == "analytics"]
    assert len(analytics) == 1
    assert analytics[0]["count"] >= 1
    assert analytics[0]["label"] == "分析"


@pytest.mark.anyio
async def test_dashboard_last_updated_no_imports(
    test_client: AsyncClient, admin_token: str
) -> None:
    """確定済みインポートがない場合 last_updated が null。"""
    response = await test_client.get(
        "/api/dashboard/last-updated",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["last_updated"] is None


@pytest.mark.anyio
async def test_dashboard_last_updated_with_confirmed_import(
    test_client: AsyncClient, admin_token: str, test_db
) -> None:
    """確定済みインポートがある場合 last_updated が返る。"""
    now = datetime.now(timezone.utc)
    await test_db["usage_imports"].insert_one(
        {
            "billing_month": "2024-05",
            "source_type": "csv",
            "file_name": "test.csv",
            "status": "confirmed",
            "confirmed_at": now,
            "uploaded_by_user_id": "dummy",
            "record_count": 1,
            "error_count": 0,
            "error_details": [],
            "replace_mode": False,
            "created_at": now,
        }
    )
    response = await test_client.get(
        "/api/dashboard/last-updated",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["last_updated"] is not None


@pytest.mark.anyio
async def test_dashboard_summary_empty_without_data(
    test_client: AsyncClient, admin_token: str
) -> None:
    """データなしの場合にサマリーが空リストを返す。"""
    response = await test_client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json() == []
