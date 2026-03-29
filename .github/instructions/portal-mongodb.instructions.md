---
description: 'SaaS ポータルアプリ向け MongoDB コレクション・インデックス設計規約。portal_* プレフィックスのコレクション'
applyTo: 'src/database/portal/**'
---

# ポータル MongoDB 設計規約

## 概要

SaaS ポータルアプリは社内管理アプリ (saas-management-app) とは**データベースを分離**する。
ポータル専用コレクションには `portal_` プレフィックスを付けて区別する。

## 仕様ドキュメント参照

詳細なフィールド定義は `docs/specs/saas-portal-mobile-app/system/03-data-model.md` を参照する。

## コレクション命名

- `portal_` プレフィックス + 複数形・スネークケース
- 例: `portal_tenants`, `portal_users`, `portal_subscriptions`

## コレクション一覧

| コレクション | 説明 | フェーズ |
|------------|------|---------|
| `portal_tenants` | テナント（顧客企業）情報 | PoC |
| `portal_users` | テナント所属ユーザー | PoC |
| `portal_subscriptions` | テナント契約サービス | PoC |
| `portal_usage_metrics` | 月次利用実績 | PoC |
| `portal_feature_flags` | Feature Flag マスタ | Phase 2 |
| `portal_tenant_features` | テナント別 Flag 状態 | Phase 2 |

## コレクション間のリレーション

```
portal_tenants ──1:N──> portal_users
portal_tenants ──1:N──> portal_subscriptions
portal_tenants ──1:N──> portal_usage_metrics
portal_subscriptions ──1:N──> portal_usage_metrics
portal_feature_flags ──M:N──> portal_tenant_features ──> portal_tenants
```

## ドキュメント設計

### portal_tenants

```json
{
  "_id": "ObjectId",
  "tenant_code": "string (unique)",
  "tenant_name": "string",
  "contact_email": "string",
  "plan_tier": "string (free|standard|enterprise)",
  "status": "string (active|suspended|terminated)",
  "subscribed_services": ["string (service_code)"],
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### portal_users

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "email": "string (unique)",
  "hashed_password": "string (bcrypt)",
  "display_name": "string",
  "role": "string (admin|member)",
  "is_active": "boolean",
  "last_login_at": "datetime (UTC, nullable)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### portal_subscriptions

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "service_code": "string (CONNECT_CHAT, CONNECT_MEET, etc.)",
  "service_name": "string",
  "plan_name": "string",
  "status": "string (active|suspended|terminated)",
  "base_price": "number",
  "metric_name": "string",
  "free_tier_limit": "number",
  "overage_unit_price": "number",
  "contract_start_date": "datetime",
  "contract_end_date": "datetime (nullable)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### portal_usage_metrics

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "subscription_id": "ObjectId (→ portal_subscriptions)",
  "service_code": "string",
  "year_month": "string (YYYY-MM)",
  "metric_name": "string",
  "quantity": "number",
  "usage_rate": "number",
  "billed_amount": "number",
  "primary_use_case": "string (nullable)",
  "recorded_at": "datetime (UTC)"
}
```

## インデックス設計

```javascript
// PoC スコープ
db.portal_tenants.createIndex({ "tenant_code": 1 }, { unique: true });

db.portal_users.createIndex({ "email": 1 }, { unique: true });
db.portal_users.createIndex({ "tenant_id": 1 });

db.portal_subscriptions.createIndex({ "tenant_id": 1 });
db.portal_subscriptions.createIndex({ "tenant_id": 1, "service_code": 1 });

db.portal_usage_metrics.createIndex({ "tenant_id": 1, "year_month": -1 });
db.portal_usage_metrics.createIndex({ "tenant_id": 1, "service_code": 1, "year_month": -1 });
db.portal_usage_metrics.createIndex({ "subscription_id": 1, "year_month": -1 });

// Phase 2
db.portal_feature_flags.createIndex({ "flag_key": 1 }, { unique: true });
db.portal_feature_flags.createIndex({ "service_code": 1 });
db.portal_tenant_features.createIndex({ "tenant_id": 1, "flag_key": 1 }, { unique: true });
```

## 社内管理アプリとのデータ連携

| ポータル側 | 管理アプリ側 | 連携方式 |
|---|---|---|
| `portal_tenants` | `customers` | 顧客コードで紐づけ |
| `portal_subscriptions` | `contracts` + `plans` | 契約情報を同期 |
| `portal_usage_metrics` | `usage_records` | 月次実績を同期 |

## 共通ドキュメント設計ルール

- `_id`: MongoDB デフォルトの `ObjectId` を使用する
- タイムスタンプ: `created_at`, `updated_at` を全コレクションに含める
- 参照: 他コレクションへの参照は `ObjectId` 型で保持する
- 更新時は `$set` + `updated_at: datetime.now(timezone.utc)` を使用する

## データ操作パターン

### Good Example

```python
from datetime import datetime, timezone
from bson import ObjectId

# ✅ テナントスコープでフィルタリング + ObjectId 変換 + タイムスタンプ
async def get_tenant_metrics(db, tenant_id: str) -> list[dict]:
    cursor = db["portal_usage_metrics"].find(
        {"tenant_id": ObjectId(tenant_id)}
    ).sort("year_month", -1)
    docs = await cursor.to_list(length=100)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
        doc["tenant_id"] = str(doc["tenant_id"])
    return docs

# ✅ 更新時に updated_at を自動設定
async def update_subscription_status(db, subscription_id: str, status: str) -> dict:
    result = await db["portal_subscriptions"].find_one_and_update(
        {"_id": ObjectId(subscription_id)},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    result["_id"] = str(result["_id"])
    return result
```

### Bad Example

```python
# ❌ テナントスコープなし — 他テナントのデータが漏洩する
async def get_all_metrics(db):
    cursor = db["portal_usage_metrics"].find({})
    return await cursor.to_list(length=None)  # ❌ length=None は危険

# ❌ updated_at を更新していない、ObjectId を文字列変換していない
async def update_status(db, sid, status):
    await db["portal_subscriptions"].update_one(
        {"_id": sid},  # ❌ ObjectId 変換なし
        {"$set": {"status": status}},  # ❌ updated_at なし
    )
```

## Validation

- 接続確認: `mongosh mongodb://localhost:27017/saas_management --eval "db.portal_tenants.stats()"`
- コレクション一覧: `mongosh mongodb://localhost:27017/saas_management --eval "db.getCollectionNames().filter(c => c.startsWith('portal_'))"`
- インデックス確認: `mongosh mongodb://localhost:27017/saas_management --eval "db.portal_tenants.getIndexes()"`
