"""ポータルサービス一覧・利用詳細・Mock 起動 API のテスト。"""

from datetime import datetime, timezone

import pytest
from bson import ObjectId


@pytest.mark.anyio
class TestPortalServicesList:
    """GET /api/portal/services"""

    async def test_services_正常_契約一覧(
        self, test_client, portal_admin_token, portal_subscriptions
    ):
        """テナントの契約サービス一覧を取得できる。"""
        response = await test_client.get(
            "/api/portal/services",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 3
        assert len(data["subscriptions"]) == 3

        service_codes = {s["service_code"] for s in data["subscriptions"]}
        assert service_codes == {"CONNECT_CHAT", "CONNECT_MEET", "CONNECT_STORE"}

        for sub in data["subscriptions"]:
            assert "service_code" in sub
            assert "service_name" in sub
            assert "plan_name" in sub
            assert "status" in sub
            assert sub["status"] == "active"

    async def test_services_テナントスコープ(
        self, test_client, portal_admin_token, portal_subscriptions, test_db
    ):
        """他テナントの契約は含まれない。"""
        other_tenant_id = ObjectId()
        await test_db["portal_subscriptions"].insert_one({
            "_id": ObjectId(),
            "tenant_id": other_tenant_id,
            "service_code": "OTHER_SERVICE",
            "service_name": "Other Service",
            "plan_name": "Basic",
            "status": "active",
            "base_price": 5000,
            "metric_name": "units",
            "free_tier_limit": 50,
            "overage_unit_price": 10,
            "contract_start_date": datetime(2025, 4, 1, tzinfo=timezone.utc),
            "contract_end_date": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        response = await test_client.get(
            "/api/portal/services",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_count"] == 3
        service_codes = {s["service_code"] for s in data["subscriptions"]}
        assert "OTHER_SERVICE" not in service_codes

    async def test_services_契約なし_空リスト(self, test_client, portal_admin_token):
        """契約がない場合は空リストを返す。"""
        response = await test_client.get(
            "/api/portal/services",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["subscriptions"] == []
        assert data["total_count"] == 0

    async def test_services_認証なし_401(self, test_client):
        """認証なしでアクセスすると 401 を返す。"""
        response = await test_client.get("/api/portal/services")
        assert response.status_code == 401


@pytest.mark.anyio
class TestPortalServiceUsage:
    """GET /api/portal/services/{service_code}/usage"""

    async def test_usage_正常_月次利用詳細(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """CONNECT_CHAT の月次利用詳細を取得できる。"""
        response = await test_client.get(
            "/api/portal/services/CONNECT_CHAT/usage",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["service_code"] == "CONNECT_CHAT"
        assert data["service_name"] == "ConnectChat"
        assert data["plan_name"] == "Enterprise"
        assert data["free_tier_limit"] == 10000
        assert data["overage_unit_price"] == 5

        assert len(data["usage_details"]) == 3
        for detail in data["usage_details"]:
            assert "year_month" in detail
            assert "metric_name" in detail
            assert "quantity" in detail
            assert "usage_rate" in detail
            assert "billed_amount" in detail

    async def test_usage_降順ソート(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """利用詳細が year_month 降順でソートされている。"""
        response = await test_client.get(
            "/api/portal/services/CONNECT_CHAT/usage",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        year_months = [d["year_month"] for d in data["usage_details"]]
        assert year_months == sorted(year_months, reverse=True)

    async def test_usage_契約なし_404(self, test_client, portal_admin_token):
        """存在しないサービスコードは 404 を返す。"""
        response = await test_client.get(
            "/api/portal/services/NONEXISTENT/usage",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 404
        assert "契約が見つかりません" in response.json()["detail"]

    async def test_usage_認証なし_401(self, test_client):
        """認証なしでアクセスすると 401 を返す。"""
        response = await test_client.get(
            "/api/portal/services/CONNECT_CHAT/usage"
        )
        assert response.status_code == 401


@pytest.mark.anyio
class TestPortalServiceLaunch:
    """POST /api/portal/services/{service_code}/launch"""

    async def test_launch_mock_正常(
        self, test_client, portal_admin_token, portal_subscriptions
    ):
        """Mock モードでサービスを起動できる。"""
        response = await test_client.post(
            "/api/portal/services/CONNECT_CHAT/launch",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_mock"] is True
        assert data["launch_url"].startswith("https://mock.")

    async def test_launch_契約なし_404(self, test_client, portal_admin_token):
        """存在しないサービスは 404 を返す。"""
        response = await test_client.post(
            "/api/portal/services/NONEXISTENT/launch",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 404

    async def test_launch_suspended_400(
        self, test_client, portal_admin_token, test_db, portal_tenant
    ):
        """停止中のサービスは 400 を返す。"""
        await test_db["portal_subscriptions"].insert_one({
            "_id": ObjectId(),
            "tenant_id": portal_tenant["_id"],
            "service_code": "CONNECT_SUSPENDED",
            "service_name": "Suspended Service",
            "plan_name": "Basic",
            "status": "suspended",
            "base_price": 10000,
            "metric_name": "units",
            "free_tier_limit": 100,
            "overage_unit_price": 50,
            "contract_start_date": datetime(2025, 4, 1, tzinfo=timezone.utc),
            "contract_end_date": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        response = await test_client.post(
            "/api/portal/services/CONNECT_SUSPENDED/launch",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 400

    async def test_launch_レスポンスフィールド(
        self, test_client, portal_admin_token, portal_subscriptions
    ):
        """レスポンスに必要なフィールドがすべて含まれる。"""
        response = await test_client.post(
            "/api/portal/services/CONNECT_CHAT/launch",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "service_code" in data
        assert "service_name" in data
        assert "launch_url" in data
        assert "launched_at" in data
        assert "is_mock" in data
        assert data["service_code"] == "CONNECT_CHAT"
        assert data["service_name"] == "ConnectChat"

    async def test_launch_認証なし_401(self, test_client):
        """認証なしでアクセスすると 401 を返す。"""
        response = await test_client.post(
            "/api/portal/services/CONNECT_CHAT/launch"
        )
        assert response.status_code == 401
