"""シードデータ投入スクリプト。

DevContainer ビルド時および手動実行でデモ用データを MongoDB に投入する。
冪等性を持ち、既にデータが存在する場合はスキップする。

Usage:
    cd src/backend && uv run python ../database/seed/seed_data.py
"""

from __future__ import annotations

from datetime import datetime, date, timezone

import bcrypt
from pymongo import MongoClient
from bson import ObjectId

# ---------- 設定 ----------
MONGO_URI = "mongodb://localhost:27017"
DATABASE_NAME = "saas_management"

NOW = datetime.now(timezone.utc)


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


def _date_str(y: int, m: int, d: int) -> str:
    return date(y, m, d).isoformat()


def seed(db) -> None:  # noqa: C901
    """全コレクションにシードデータを投入する。"""

    # ── 冪等チェック: products が存在していればスキップ ──
    if db.products.count_documents({}) > 0:
        print("シードデータは既に投入済みです。スキップします。")
        return

    # ================================================================
    # 1. Users
    # ================================================================
    admin_exists = db.users.count_documents({"email": "admin@example.com"}) > 0

    users_data = []
    if not admin_exists:
        users_data.append(
            {
                "_id": ObjectId(),
                "email": "admin@example.com",
                "display_name": "管理者",
                "role": "admin",
                "password_hash": _hash("admin123"),
                "is_active": True,
                "created_at": NOW,
                "updated_at": NOW,
            }
        )

    sales1_id = ObjectId()
    sales2_id = ObjectId()
    users_data.extend(
        [
            {
                "_id": sales1_id,
                "email": "sales@example.com",
                "display_name": "田中太郎",
                "role": "sales",
                "password_hash": _hash("sales123"),
                "is_active": True,
                "created_at": NOW,
                "updated_at": NOW,
            },
            {
                "_id": sales2_id,
                "email": "sales2@example.com",
                "display_name": "佐藤花子",
                "role": "sales",
                "password_hash": _hash("sales123"),
                "is_active": True,
                "created_at": NOW,
                "updated_at": NOW,
            },
        ]
    )

    if users_data:
        db.users.insert_many(users_data)
        print(f"  users: {len(users_data)} 件挿入")

    # admin の _id を取得
    admin_user = db.users.find_one({"email": "admin@example.com"})
    admin_id = str(admin_user["_id"])

    # 参照フィールドは文字列で保存する（アプリの規約に合わせる）
    sales1_str = str(sales1_id)
    sales2_str = str(sales2_id)

    # ================================================================
    # 2. Products
    # ================================================================
    prod_crm_id = ObjectId()
    prod_sync_id = ObjectId()
    prod_ai_id = ObjectId()

    products = [
        {
            "_id": prod_crm_id,
            "product_code": "CRM-001",
            "product_name": "CloudCRM Pro",
            "category": "CRM",
            "vendor": "CloudCRM Inc.",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": prod_sync_id,
            "product_code": "SYNC-001",
            "product_name": "DataSync Hub",
            "category": "データ同期",
            "vendor": "SyncTech Ltd.",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": prod_ai_id,
            "product_code": "AI-001",
            "product_name": "AI Analytics",
            "category": "分析",
            "vendor": "Analytics Corp.",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
    ]
    db.products.insert_many(products)
    print(f"  products: {len(products)} 件挿入")

    # 参照用の文字列 ID
    prod_crm_str = str(prod_crm_id)
    prod_sync_str = str(prod_sync_id)
    prod_ai_str = str(prod_ai_id)

    # ================================================================
    # 3. Metrics Definitions
    # ================================================================
    metrics = [
        # CloudCRM Pro
        {
            "_id": ObjectId(),
            "product_id": prod_crm_str,
            "metric_code": "api_calls",
            "metric_name": "API呼び出し数",
            "unit": "回",
            "description": "月間のAPI呼び出し回数",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": ObjectId(),
            "product_id": prod_crm_str,
            "metric_code": "storage_gb",
            "metric_name": "ストレージ容量",
            "unit": "GB",
            "description": "使用ストレージ容量",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        # DataSync Hub
        {
            "_id": ObjectId(),
            "product_id": prod_sync_str,
            "metric_code": "sync_records",
            "metric_name": "同期レコード数",
            "unit": "件",
            "description": "月間の同期レコード数",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": ObjectId(),
            "product_id": prod_sync_str,
            "metric_code": "connections",
            "metric_name": "接続数",
            "unit": "接続",
            "description": "アクティブな接続数",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        # AI Analytics
        {
            "_id": ObjectId(),
            "product_id": prod_ai_str,
            "metric_code": "queries",
            "metric_name": "クエリ数",
            "unit": "回",
            "description": "月間の分析クエリ実行数",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": ObjectId(),
            "product_id": prod_ai_str,
            "metric_code": "processed_gb",
            "metric_name": "処理データ量",
            "unit": "GB",
            "description": "分析処理されたデータ量",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
    ]
    db.metrics_definitions.insert_many(metrics)
    print(f"  metrics_definitions: {len(metrics)} 件挿入")

    # ================================================================
    # 4. Plans
    # ================================================================
    plan_crm_basic_id = ObjectId()
    plan_crm_std_id = ObjectId()
    plan_crm_ent_id = ObjectId()
    plan_sync_starter_id = ObjectId()
    plan_sync_pro_id = ObjectId()
    plan_ai_lite_id = ObjectId()
    plan_ai_biz_id = ObjectId()

    plans = [
        # CloudCRM Pro
        {
            "_id": plan_crm_basic_id,
            "product_id": prod_crm_str,
            "plan_code": "CRM-BASIC",
            "plan_name": "ベーシック",
            "monthly_base_fee": 50000,
            "alert_threshold_pct": 80,
            "metric_limits": [
                {"metric_code": "api_calls", "limit_value": 10000, "overage_unit_price": 5},
                {"metric_code": "storage_gb", "limit_value": 50, "overage_unit_price": 500},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": plan_crm_std_id,
            "product_id": prod_crm_str,
            "plan_code": "CRM-STD",
            "plan_name": "スタンダード",
            "monthly_base_fee": 100000,
            "alert_threshold_pct": 90,
            "metric_limits": [
                {"metric_code": "api_calls", "limit_value": 50000, "overage_unit_price": 3},
                {"metric_code": "storage_gb", "limit_value": 200, "overage_unit_price": 400},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": plan_crm_ent_id,
            "product_id": prod_crm_str,
            "plan_code": "CRM-ENT",
            "plan_name": "エンタープライズ",
            "monthly_base_fee": 250000,
            "alert_threshold_pct": 90,
            "metric_limits": [
                {"metric_code": "api_calls", "limit_value": 200000, "overage_unit_price": 2},
                {"metric_code": "storage_gb", "limit_value": 1000, "overage_unit_price": 300},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        # DataSync Hub
        {
            "_id": plan_sync_starter_id,
            "product_id": prod_sync_str,
            "plan_code": "SYNC-START",
            "plan_name": "スターター",
            "monthly_base_fee": 30000,
            "alert_threshold_pct": 85,
            "metric_limits": [
                {"metric_code": "sync_records", "limit_value": 100000, "overage_unit_price": 0.5},
                {"metric_code": "connections", "limit_value": 5, "overage_unit_price": 3000},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": plan_sync_pro_id,
            "product_id": prod_sync_str,
            "plan_code": "SYNC-PRO",
            "plan_name": "プロフェッショナル",
            "monthly_base_fee": 80000,
            "alert_threshold_pct": 90,
            "metric_limits": [
                {"metric_code": "sync_records", "limit_value": 500000, "overage_unit_price": 0.3},
                {"metric_code": "connections", "limit_value": 20, "overage_unit_price": 2000},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        # AI Analytics
        {
            "_id": plan_ai_lite_id,
            "product_id": prod_ai_str,
            "plan_code": "AI-LITE",
            "plan_name": "ライト",
            "monthly_base_fee": 40000,
            "alert_threshold_pct": 80,
            "metric_limits": [
                {"metric_code": "queries", "limit_value": 5000, "overage_unit_price": 10},
                {"metric_code": "processed_gb", "limit_value": 100, "overage_unit_price": 200},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": plan_ai_biz_id,
            "product_id": prod_ai_str,
            "plan_code": "AI-BIZ",
            "plan_name": "ビジネス",
            "monthly_base_fee": 120000,
            "alert_threshold_pct": 90,
            "metric_limits": [
                {"metric_code": "queries", "limit_value": 30000, "overage_unit_price": 5},
                {"metric_code": "processed_gb", "limit_value": 500, "overage_unit_price": 150},
            ],
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
    ]
    db.plans.insert_many(plans)
    print(f"  plans: {len(plans)} 件挿入")

    # ================================================================
    # 5. Customers
    # ================================================================
    cust1_id = ObjectId()
    cust2_id = ObjectId()
    cust3_id = ObjectId()
    cust4_id = ObjectId()
    cust5_id = ObjectId()

    customers = [
        {
            "_id": cust1_id,
            "customer_code": "CUS-001",
            "customer_name": "株式会社テクノソリューション",
            "assigned_sales_user_id": sales1_str,
            "contact_person": "鈴木一郎",
            "notes": "大口顧客。年間契約更新は3月。",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": cust2_id,
            "customer_code": "CUS-002",
            "customer_name": "グローバルシステムズ株式会社",
            "assigned_sales_user_id": sales1_str,
            "contact_person": "山田次郎",
            "notes": "API利用量が多い。従量課金に注意。",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": cust3_id,
            "customer_code": "CUS-003",
            "customer_name": "日本データサービス株式会社",
            "assigned_sales_user_id": sales2_str,
            "contact_person": "高橋三郎",
            "notes": "複数製品を導入済み。",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": cust4_id,
            "customer_code": "CUS-004",
            "customer_name": "株式会社クラウドネクスト",
            "assigned_sales_user_id": sales2_str,
            "contact_person": "伊藤四郎",
            "notes": "スタートアップ企業。成長中。",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
        {
            "_id": cust5_id,
            "customer_code": "CUS-005",
            "customer_name": "エンタープライズ・ジャパン株式会社",
            "assigned_sales_user_id": sales1_str,
            "contact_person": "渡辺五郎",
            "notes": "エンタープライズプラン利用。サポート対応優先。",
            "is_active": True,
            "created_at": NOW,
            "updated_at": NOW,
        },
    ]
    db.customers.insert_many(customers)
    print(f"  customers: {len(customers)} 件挿入")

    # ================================================================
    # 6. Contracts
    # ================================================================
    contract1_id = ObjectId()
    contract2_id = ObjectId()
    contract3_id = ObjectId()
    contract4_id = ObjectId()
    contract5_id = ObjectId()
    contract6_id = ObjectId()

    # 参照フィールド用の文字列 ID
    cust1_str = str(cust1_id)
    cust2_str = str(cust2_id)
    cust3_str = str(cust3_id)
    cust4_str = str(cust4_id)
    cust5_str = str(cust5_id)
    plan_crm_basic_str = str(plan_crm_basic_id)
    plan_crm_std_str = str(plan_crm_std_id)
    plan_crm_ent_str = str(plan_crm_ent_id)
    plan_sync_pro_str = str(plan_sync_pro_id)
    plan_ai_lite_str = str(plan_ai_lite_id)
    plan_ai_biz_str = str(plan_ai_biz_id)

    contracts = [
        # CUS-001: CloudCRM Pro エンタープライズ
        {
            "_id": contract1_id,
            "customer_id": cust1_str,
            "product_id": prod_crm_str,
            "current_plan_id": plan_crm_ent_str,
            "contract_start_date": _date_str(2025, 4, 1),
            "contract_end_date": _date_str(2026, 3, 31),
            "contract_renewal_date": _date_str(2026, 3, 1),
            "license_count": 50,
            "status": "active",
            "primary_use_case": "sales_ops",
            "created_at": NOW,
            "updated_at": NOW,
        },
        # CUS-002: CloudCRM Pro スタンダード
        {
            "_id": contract2_id,
            "customer_id": cust2_str,
            "product_id": prod_crm_str,
            "current_plan_id": plan_crm_std_str,
            "contract_start_date": _date_str(2025, 7, 1),
            "contract_end_date": _date_str(2026, 6, 30),
            "contract_renewal_date": _date_str(2026, 6, 1),
            "license_count": 20,
            "status": "active",
            "primary_use_case": "customer_support",
            "created_at": NOW,
            "updated_at": NOW,
        },
        # CUS-003: DataSync Hub プロフェッショナル
        {
            "_id": contract3_id,
            "customer_id": cust3_str,
            "product_id": prod_sync_str,
            "current_plan_id": plan_sync_pro_str,
            "contract_start_date": _date_str(2025, 1, 1),
            "contract_end_date": _date_str(2025, 12, 31),
            "contract_renewal_date": _date_str(2025, 12, 1),
            "license_count": 10,
            "status": "renewing",
            "primary_use_case": "integration",
            "created_at": NOW,
            "updated_at": NOW,
        },
        # CUS-003: AI Analytics ビジネス
        {
            "_id": contract4_id,
            "customer_id": cust3_str,
            "product_id": prod_ai_str,
            "current_plan_id": plan_ai_biz_str,
            "contract_start_date": _date_str(2025, 6, 1),
            "contract_end_date": _date_str(2026, 5, 31),
            "contract_renewal_date": _date_str(2026, 5, 1),
            "license_count": 15,
            "status": "active",
            "primary_use_case": "analytics",
            "created_at": NOW,
            "updated_at": NOW,
        },
        # CUS-004: CloudCRM Pro ベーシック
        {
            "_id": contract5_id,
            "customer_id": cust4_str,
            "product_id": prod_crm_str,
            "current_plan_id": plan_crm_basic_str,
            "contract_start_date": _date_str(2025, 10, 1),
            "contract_end_date": _date_str(2026, 9, 30),
            "contract_renewal_date": _date_str(2026, 9, 1),
            "license_count": 5,
            "status": "active",
            "primary_use_case": "sales_ops",
            "created_at": NOW,
            "updated_at": NOW,
        },
        # CUS-005: AI Analytics ライト
        {
            "_id": contract6_id,
            "customer_id": cust5_str,
            "product_id": prod_ai_str,
            "current_plan_id": plan_ai_lite_str,
            "contract_start_date": _date_str(2025, 8, 1),
            "contract_end_date": _date_str(2026, 7, 31),
            "contract_renewal_date": _date_str(2026, 7, 1),
            "license_count": 8,
            "status": "active",
            "primary_use_case": "analytics",
            "created_at": NOW,
            "updated_at": NOW,
        },
    ]
    db.contracts.insert_many(contracts)
    print(f"  contracts: {len(contracts)} 件挿入")

    # ================================================================
    # 7. Contract Plan History (初期プラン割り当て)
    # ================================================================
    # 参照フィールド用の文字列 ID (contracts)
    contract1_str = str(contract1_id)
    contract2_str = str(contract2_id)
    contract3_str = str(contract3_id)
    contract4_str = str(contract4_id)
    contract5_str = str(contract5_id)
    contract6_str = str(contract6_id)

    plan_history = [
        {
            "contract_id": contract1_str,
            "plan_id": plan_crm_ent_str,
            "effective_from": _date_str(2025, 4, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 250000,
            "metric_limits_snapshot": [
                {"metric_code": "api_calls", "limit_value": 200000, "overage_unit_price": 2},
                {"metric_code": "storage_gb", "limit_value": 1000, "overage_unit_price": 300},
            ],
            "license_count_snapshot": 50,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 4, 1),
        },
        {
            "contract_id": contract2_str,
            "plan_id": plan_crm_std_str,
            "effective_from": _date_str(2025, 7, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 100000,
            "metric_limits_snapshot": [
                {"metric_code": "api_calls", "limit_value": 50000, "overage_unit_price": 3},
                {"metric_code": "storage_gb", "limit_value": 200, "overage_unit_price": 400},
            ],
            "license_count_snapshot": 20,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 7, 1),
        },
        {
            "contract_id": contract3_str,
            "plan_id": plan_sync_pro_str,
            "effective_from": _date_str(2025, 1, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 80000,
            "metric_limits_snapshot": [
                {"metric_code": "sync_records", "limit_value": 500000, "overage_unit_price": 0.3},
                {"metric_code": "connections", "limit_value": 20, "overage_unit_price": 2000},
            ],
            "license_count_snapshot": 10,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 1, 1),
        },
        {
            "contract_id": contract4_str,
            "plan_id": plan_ai_biz_str,
            "effective_from": _date_str(2025, 6, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 120000,
            "metric_limits_snapshot": [
                {"metric_code": "queries", "limit_value": 30000, "overage_unit_price": 5},
                {"metric_code": "processed_gb", "limit_value": 500, "overage_unit_price": 150},
            ],
            "license_count_snapshot": 15,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 6, 1),
        },
        {
            "contract_id": contract5_str,
            "plan_id": plan_crm_basic_str,
            "effective_from": _date_str(2025, 10, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 50000,
            "metric_limits_snapshot": [
                {"metric_code": "api_calls", "limit_value": 10000, "overage_unit_price": 5},
                {"metric_code": "storage_gb", "limit_value": 50, "overage_unit_price": 500},
            ],
            "license_count_snapshot": 5,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 10, 1),
        },
        {
            "contract_id": contract6_str,
            "plan_id": plan_ai_lite_str,
            "effective_from": _date_str(2025, 8, 1),
            "effective_to": None,
            "monthly_base_fee_snapshot": 40000,
            "metric_limits_snapshot": [
                {"metric_code": "queries", "limit_value": 5000, "overage_unit_price": 10},
                {"metric_code": "processed_gb", "limit_value": 100, "overage_unit_price": 200},
            ],
            "license_count_snapshot": 8,
            "change_reason": "新規契約",
            "changed_by_user_id": admin_id,
            "created_at": _dt(2025, 8, 1),
        },
    ]
    db.contract_plan_history.insert_many(plan_history)
    print(f"  contract_plan_history: {len(plan_history)} 件挿入")

    # ================================================================
    # 8. Monthly Usage (直近3ヶ月分)
    # ================================================================
    import_id = ObjectId()
    import_id_str = str(import_id)
    usage_data = []

    # (contract_id, customer_id, product_id, [(billing_month, [(metric, actual, limit)])])
    usage_entries = [
        # CUS-001 CloudCRM Pro エンタープライズ
        (contract1_str, cust1_str, prod_crm_str, [
            ("2026-01", [("api_calls", 180000, 200000), ("storage_gb", 820, 1000)]),
            ("2026-02", [("api_calls", 195000, 200000), ("storage_gb", 870, 1000)]),
            ("2026-03", [("api_calls", 210000, 200000), ("storage_gb", 910, 1000)]),
        ]),
        # CUS-002 CloudCRM Pro スタンダード
        (contract2_str, cust2_str, prod_crm_str, [
            ("2026-01", [("api_calls", 42000, 50000), ("storage_gb", 150, 200)]),
            ("2026-02", [("api_calls", 48000, 50000), ("storage_gb", 165, 200)]),
            ("2026-03", [("api_calls", 53000, 50000), ("storage_gb", 180, 200)]),
        ]),
        # CUS-003 DataSync Hub プロフェッショナル
        (contract3_str, cust3_str, prod_sync_str, [
            ("2026-01", [("sync_records", 380000, 500000), ("connections", 15, 20)]),
            ("2026-02", [("sync_records", 420000, 500000), ("connections", 18, 20)]),
            ("2026-03", [("sync_records", 460000, 500000), ("connections", 19, 20)]),
        ]),
        # CUS-003 AI Analytics ビジネス
        (contract4_str, cust3_str, prod_ai_str, [
            ("2026-01", [("queries", 22000, 30000), ("processed_gb", 350, 500)]),
            ("2026-02", [("queries", 27000, 30000), ("processed_gb", 420, 500)]),
            ("2026-03", [("queries", 31000, 30000), ("processed_gb", 480, 500)]),
        ]),
        # CUS-004 CloudCRM Pro ベーシック
        (contract5_str, cust4_str, prod_crm_str, [
            ("2026-01", [("api_calls", 7500, 10000), ("storage_gb", 30, 50)]),
            ("2026-02", [("api_calls", 8500, 10000), ("storage_gb", 35, 50)]),
            ("2026-03", [("api_calls", 9800, 10000), ("storage_gb", 42, 50)]),
        ]),
        # CUS-005 AI Analytics ライト
        (contract6_str, cust5_str, prod_ai_str, [
            ("2026-01", [("queries", 4200, 5000), ("processed_gb", 78, 100)]),
            ("2026-02", [("queries", 4800, 5000), ("processed_gb", 92, 100)]),
            ("2026-03", [("queries", 5200, 5000), ("processed_gb", 105, 100)]),
        ]),
    ]

    # 超過単価マップ
    plan_overage_prices = {
        plan_crm_ent_str: {"api_calls": 2, "storage_gb": 300},
        plan_crm_std_str: {"api_calls": 3, "storage_gb": 400},
        plan_crm_basic_str: {"api_calls": 5, "storage_gb": 500},
        plan_sync_pro_str: {"sync_records": 0.3, "connections": 2000},
        plan_ai_biz_str: {"queries": 5, "processed_gb": 150},
        plan_ai_lite_str: {"queries": 10, "processed_gb": 200},
    }

    contract_plan_map = {
        contract1_str: plan_crm_ent_str,
        contract2_str: plan_crm_std_str,
        contract3_str: plan_sync_pro_str,
        contract4_str: plan_ai_biz_str,
        contract5_str: plan_crm_basic_str,
        contract6_str: plan_ai_lite_str,
    }

    for contract_id, customer_id, product_id, months in usage_entries:
        plan_id = contract_plan_map[contract_id]
        overage_prices = plan_overage_prices[plan_id]
        for billing_month, metrics_list in months:
            for metric_code, actual_value, limit_value in metrics_list:
                usage_rate = round(actual_value / limit_value * 100, 1) if limit_value > 0 else 0
                overage_count = max(0, actual_value - limit_value)
                unit_price = overage_prices.get(metric_code, 0)
                overage_fee = round(overage_count * unit_price, 2)

                usage_data.append(
                    {
                        "contract_id": contract_id,
                        "customer_id": customer_id,
                        "product_id": product_id,
                        "billing_month": billing_month,
                        "metric_code": metric_code,
                        "actual_value": actual_value,
                        "limit_value_snapshot": limit_value,
                        "usage_rate": usage_rate,
                        "overage_count": overage_count,
                        "overage_fee": overage_fee,
                        "import_id": import_id_str,
                        "calculation_status": "confirmed",
                        "imported_at": NOW,
                        "confirmed_at": NOW,
                    }
                )

    db.monthly_usage.insert_many(usage_data)
    print(f"  monthly_usage: {len(usage_data)} 件挿入")

    # ================================================================
    # 9. Usage Imports (取込履歴)
    # ================================================================
    usage_imports = [
        {
            "_id": import_id,
            "billing_month": "2026-01",
            "source_type": "csv",
            "file_name": "usage_202601.csv",
            "file_hash": "seed_data_hash_202601",
            "replace_mode": False,
            "status": "confirmed",
            "uploaded_by_user_id": admin_id,
            "record_count": 12,
            "error_count": 0,
            "error_details": [],
            "created_at": _dt(2026, 2, 3),
            "confirmed_at": _dt(2026, 2, 3),
        },
    ]
    db.usage_imports.insert_many(usage_imports)
    print(f"  usage_imports: {len(usage_imports)} 件挿入")

    print("\nシードデータの投入が完了しました。")


def main() -> None:
    print("MongoDB シードデータ投入を開始します...")
    print(f"  接続先: {MONGO_URI}")
    print(f"  データベース: {DATABASE_NAME}\n")

    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]

    try:
        seed(db)
    finally:
        client.close()


if __name__ == "__main__":
    main()
