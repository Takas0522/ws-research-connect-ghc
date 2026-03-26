# データモデル

## コレクション一覧

社内管理向けアプリ（saas-management-app）とはデータベースを分離する。ポータル専用のMongoDBデータベースを使用する。

| コレクション名 | 説明 |
|---|---|
| `portal_tenants` | テナント（顧客企業）情報 |
| `portal_users` | テナントに所属するユーザー情報 |
| `portal_subscriptions` | テナントが契約しているサービス情報 |
| `portal_usage_metrics` | 月次利用実績データ |
| `portal_feature_flags` | Feature Flagマスタ（Phase 2） |
| `portal_tenant_features` | テナントごとのFeature Flag状態（Phase 2） |

## コレクション詳細

### portal_tenants（テナント）

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

### portal_users（ユーザー）

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

### portal_subscriptions（契約サービス）

テナントが契約しているSaaSサービスの情報。社内管理アプリの `contracts` コレクションから同期される想定。

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "service_code": "string (CONNECT_CHAT, CONNECT_MEET, etc.)",
  "service_name": "string",
  "plan_name": "string",
  "status": "string (active|suspended|terminated)",
  "base_price": "number",
  "metric_name": "string (従量メトリクス名)",
  "free_tier_limit": "number (無料枠)",
  "overage_unit_price": "number (超過単価)",
  "contract_start_date": "datetime",
  "contract_end_date": "datetime (nullable)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### portal_usage_metrics（月次利用実績）

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "subscription_id": "ObjectId (→ portal_subscriptions)",
  "service_code": "string",
  "year_month": "string (YYYY-MM)",
  "metric_name": "string",
  "quantity": "number",
  "usage_rate": "number (利用率 = quantity / free_tier_limit)",
  "billed_amount": "number (請求額)",
  "primary_use_case": "string (nullable, 利用目的)",
  "recorded_at": "datetime (UTC)"
}
```

### portal_feature_flags（Feature Flagマスタ）— Phase 2

```json
{
  "_id": "ObjectId",
  "flag_key": "string (unique, e.g. 'connect_chat_ai_reply')",
  "service_code": "string (対象SaaSサービス)",
  "name": "string (機能名)",
  "description": "string (機能説明)",
  "is_beta": "boolean",
  "is_globally_enabled": "boolean (全テナントデフォルト)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### portal_tenant_features（テナント別Feature Flag状態）— Phase 2

```json
{
  "_id": "ObjectId",
  "tenant_id": "ObjectId (→ portal_tenants)",
  "flag_key": "string (→ portal_feature_flags.flag_key)",
  "is_enabled": "boolean",
  "enabled_by": "ObjectId (→ portal_users, 有効化した管理者)",
  "enabled_at": "datetime (UTC, nullable)",
  "disabled_at": "datetime (UTC, nullable)"
}
```

## インデックス設計

```javascript
// portal_tenants
db.portal_tenants.createIndex({ "tenant_code": 1 }, { unique: true });

// portal_users
db.portal_users.createIndex({ "email": 1 }, { unique: true });
db.portal_users.createIndex({ "tenant_id": 1 });

// portal_subscriptions
db.portal_subscriptions.createIndex({ "tenant_id": 1 });
db.portal_subscriptions.createIndex({ "tenant_id": 1, "service_code": 1 });

// portal_usage_metrics
db.portal_usage_metrics.createIndex({ "tenant_id": 1, "year_month": -1 });
db.portal_usage_metrics.createIndex({ "tenant_id": 1, "service_code": 1, "year_month": -1 });
db.portal_usage_metrics.createIndex({ "subscription_id": 1, "year_month": -1 });

// portal_feature_flags (Phase 2)
db.portal_feature_flags.createIndex({ "flag_key": 1 }, { unique: true });
db.portal_feature_flags.createIndex({ "service_code": 1 });

// portal_tenant_features (Phase 2)
db.portal_tenant_features.createIndex({ "tenant_id": 1, "flag_key": 1 }, { unique: true });
```

## 社内管理アプリとのデータ連携

ポータルアプリのデータは、社内管理アプリ（saas-management-app）の以下コレクションと対応関係を持つ。

| ポータル側 | 管理アプリ側 | 連携方式 |
|---|---|---|
| `portal_tenants` | `customers` | 顧客コードで紐づけ |
| `portal_subscriptions` | `contracts` + `plans` | 契約情報を同期 |
| `portal_usage_metrics` | `usage_records` | 月次実績を同期 |

データ同期の方式（バッチ同期 / イベント駆動 / API連携）はPhase 1で設計する。
