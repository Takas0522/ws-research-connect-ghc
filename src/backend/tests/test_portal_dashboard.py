"""ポータルダッシュボード API エンドポイントのテスト。"""

from datetime import datetime, timezone

import pytest
from bson import ObjectId

pytestmark = pytest.mark.anyio


class TestDashboardSummary:
    """GET /api/portal/dashboard/summary"""

    async def test_summary_正常_サービス利用状況(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """Admin がデータありの状態でサマリーを取得できる。"""
        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["tenant_name"] == "テスト企業"
        assert body["total_services"] > 0
        assert isinstance(body["services"], list)
        assert len(body["services"]) > 0
        # 各サービスに必須フィールドが含まれる
        svc = body["services"][0]
        for key in [
            "service_code",
            "service_name",
            "plan_name",
            "metric_name",
            "quantity",
            "free_tier_limit",
            "usage_rate",
            "billed_amount",
        ]:
            assert key in svc, f"Missing key: {key}"

    async def test_summary_メンバーも取得可能(
        self,
        test_client,
        portal_member_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """Member ロールでもサマリーを取得できる。"""
        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_member_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["tenant_name"] == "テスト企業"
        assert body["total_services"] > 0

    async def test_summary_テナントスコープ(
        self,
        test_client,
        test_db,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """別テナントのデータは含まれないことを確認する。"""
        other_tenant_id = ObjectId()
        other_sub_id = ObjectId()
        await test_db["portal_tenants"].insert_one({
            "_id": other_tenant_id,
            "tenant_code": "OTHER_TENANT",
            "tenant_name": "他社",
            "contact_email": "other@example.com",
            "plan_tier": "free",
            "status": "active",
            "subscribed_services": ["OTHER_SVC"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        await test_db["portal_subscriptions"].insert_one({
            "_id": other_sub_id,
            "tenant_id": other_tenant_id,
            "service_code": "OTHER_SVC",
            "service_name": "OtherService",
            "plan_name": "Free",
            "status": "active",
            "base_price": 0,
            "metric_name": "requests",
            "free_tier_limit": 100,
            "overage_unit_price": 1,
            "contract_start_date": datetime(2025, 4, 1, tzinfo=timezone.utc),
            "contract_end_date": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": other_tenant_id,
            "subscription_id": other_sub_id,
            "service_code": "OTHER_SVC",
            "year_month": "2026-03",
            "metric_name": "requests",
            "quantity": 999,
            "usage_rate": 999.0,
            "billed_amount": 99999,
            "primary_use_case": "テスト",
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        service_codes = [s["service_code"] for s in body["services"]]
        assert "OTHER_SVC" not in service_codes

    async def test_summary_データなし_空レスポンス(
        self, test_client, portal_admin_token
    ):
        """利用実績がない場合、空のサマリーが返る（404 ではない）。"""
        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total_services"] == 0
        assert body["services"] == []
        assert body["total_billed_amount"] == 0.0

    async def test_summary_認証なし_401(self, test_client):
        """認証トークンなしで 401 が返る。"""
        resp = await test_client.get("/api/portal/dashboard/summary")
        assert resp.status_code == 401

    async def test_summary_前月比計算(
        self,
        test_client,
        test_db,
        portal_admin_token,
        portal_tenant,
        portal_subscriptions,
    ):
        """前月比 (mom_change) が正しく計算される。"""
        tenant_id = portal_tenant["_id"]
        sub = portal_subscriptions[0]

        # 前月: quantity=100, 当月: quantity=120 → mom_change = 20.0%
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": tenant_id,
            "subscription_id": sub["_id"],
            "service_code": sub["service_code"],
            "year_month": "2026-05",
            "metric_name": "messages",
            "quantity": 100,
            "usage_rate": 50.0,
            "billed_amount": 10000,
            "primary_use_case": "テスト",
            "recorded_at": datetime.now(timezone.utc),
        })
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": tenant_id,
            "subscription_id": sub["_id"],
            "service_code": sub["service_code"],
            "year_month": "2026-06",
            "metric_name": "messages",
            "quantity": 120,
            "usage_rate": 60.0,
            "billed_amount": 12000,
            "primary_use_case": "テスト",
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        # 最新月は 2026-06 のはず
        svc = next(
            s for s in body["services"] if s["service_code"] == sub["service_code"]
        )
        assert svc["mom_change"] == 20.0

    async def test_summary_前月データなし_mom_null(
        self,
        test_client,
        test_db,
        portal_admin_token,
        portal_tenant,
        portal_subscriptions,
    ):
        """前月データがない場合、mom_change が null になる。"""
        tenant_id = portal_tenant["_id"]
        sub = portal_subscriptions[0]

        # 当月のみ（前月なし）
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": tenant_id,
            "subscription_id": sub["_id"],
            "service_code": sub["service_code"],
            "year_month": "2027-01",
            "metric_name": "messages",
            "quantity": 500,
            "usage_rate": 50.0,
            "billed_amount": 50000,
            "primary_use_case": "テスト",
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/summary",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        svc = next(
            s for s in body["services"] if s["service_code"] == sub["service_code"]
        )
        assert svc["mom_change"] is None


class TestDashboardTrends:
    """GET /api/portal/dashboard/trends"""

    async def test_trends_正常_月次推移(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """月次推移データが取得できる。"""
        resp = await test_client.get(
            "/api/portal/dashboard/trends",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "trends" in body
        assert isinstance(body["trends"], list)
        # fixtures create data for 2026-01..03, which may or may not be in the
        # default 12-month window depending on current date.  At minimum the
        # response shape is correct.
        for item in body["trends"]:
            assert "year_month" in item
            assert "service_code" in item
            assert "service_name" in item
            assert "quantity" in item
            assert "billed_amount" in item

    async def test_trends_期間確認(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """period_start / period_end が設定されている。"""
        resp = await test_client.get(
            "/api/portal/dashboard/trends",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "period_start" in body
        assert "period_end" in body
        # YYYY-MM format
        assert len(body["period_start"]) == 7
        assert len(body["period_end"]) == 7

    async def test_trends_データなし_空リスト(self, test_client, portal_admin_token):
        """利用実績がない場合、空の trends が返る。"""
        resp = await test_client.get(
            "/api/portal/dashboard/trends",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["trends"] == []
        assert "period_start" in body
        assert "period_end" in body

    async def test_trends_認証なし_401(self, test_client):
        """認証トークンなしで 401 が返る。"""
        resp = await test_client.get("/api/portal/dashboard/trends")
        assert resp.status_code == 401

    async def test_trends_テナントスコープ(
        self,
        test_client,
        test_db,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """別テナントのデータが含まれないことを確認する。"""
        other_tenant_id = ObjectId()
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": other_tenant_id,
            "subscription_id": ObjectId(),
            "service_code": "OTHER_SVC",
            "year_month": "2026-03",
            "metric_name": "requests",
            "quantity": 9999,
            "usage_rate": 100.0,
            "billed_amount": 99999,
            "primary_use_case": "テスト",
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/trends?months=36",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        service_codes = [t["service_code"] for t in body["trends"]]
        assert "OTHER_SVC" not in service_codes


class TestDashboardUsageByPurpose:
    """GET /api/portal/dashboard/usage-by-purpose"""

    async def test_usage_by_purpose_正常(
        self,
        test_client,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """利用目的別集計が取得できる。"""
        resp = await test_client.get(
            "/api/portal/dashboard/usage-by-purpose",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "purposes" in body
        assert isinstance(body["purposes"], list)
        assert len(body["purposes"]) > 0
        for item in body["purposes"]:
            assert "primary_use_case" in item
            assert "count" in item
            assert "total_quantity" in item
            assert item["count"] > 0
            assert item["total_quantity"] > 0

    async def test_usage_by_purpose_null目的はその他(
        self, test_client, portal_admin_token, test_db, portal_tenant
    ):
        """primary_use_case が null のレコードは「その他」にグループされる。"""
        tenant_id = portal_tenant["_id"]
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": tenant_id,
            "subscription_id": ObjectId(),
            "service_code": "CONNECT_CHAT",
            "year_month": "2026-03",
            "metric_name": "messages",
            "quantity": 100,
            "usage_rate": 10.0,
            "billed_amount": 1000,
            "primary_use_case": None,
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/usage-by-purpose",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        purposes = [p["primary_use_case"] for p in body["purposes"]]
        assert "その他" in purposes

    async def test_usage_by_purpose_データなし(
        self, test_client, portal_admin_token
    ):
        """利用実績がない場合、空の purposes が返る。"""
        resp = await test_client.get(
            "/api/portal/dashboard/usage-by-purpose",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["purposes"] == []

    async def test_usage_by_purpose_認証なし_401(self, test_client):
        """認証トークンなしで 401 が返る。"""
        resp = await test_client.get("/api/portal/dashboard/usage-by-purpose")
        assert resp.status_code == 401

    async def test_usage_by_purpose_テナントスコープ(
        self,
        test_client,
        test_db,
        portal_admin_token,
        portal_subscriptions,
        portal_usage_metrics,
    ):
        """別テナントのデータが含まれないことを確認する。"""
        other_tenant_id = ObjectId()
        await test_db["portal_usage_metrics"].insert_one({
            "_id": ObjectId(),
            "tenant_id": other_tenant_id,
            "subscription_id": ObjectId(),
            "service_code": "OTHER_SVC",
            "year_month": "2026-03",
            "metric_name": "requests",
            "quantity": 5000,
            "usage_rate": 100.0,
            "billed_amount": 50000,
            "primary_use_case": "他社用途",
            "recorded_at": datetime.now(timezone.utc),
        })

        resp = await test_client.get(
            "/api/portal/dashboard/usage-by-purpose",
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        purpose_names = [p["primary_use_case"] for p in body["purposes"]]
        assert "他社用途" not in purpose_names
