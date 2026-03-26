# データモデル・マスタ設計

## 設計方針

- MongoDB 7 を前提とし、各ドキュメントは `ObjectId` を主キーとする
- 日時は **UTC** で保存し、UI表示や営業日判定は **Asia/Tokyo** を基準とする
- Phase 1 は **月次確定データの管理** を主目的とし、リアルタイム集計や自動按分は Phase 2 で拡張する
- マスタ系データは `is_active` を持つ論理無効化を基本とし、参照履歴を失わないようにする

## コレクション設計（MongoDB）

### users（ユーザー）

認証対象の社内ユーザーを管理する。

```json
{
  "_id": "ObjectId",
  "email": "string",
  "display_name": "string",
  "role": "sales | admin",
  "password_hash": "string",
  "is_active": true,
  "last_login_at": "datetime (UTC)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### products（製品マスタ）

SaaS製品の基本情報を管理する。

```json
{
  "_id": "ObjectId",
  "product_code": "string",
  "product_name": "string",
  "category": "string",
  "vendor": "string",
  "is_active": true,
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

現行データに基づく製品一覧：

| 製品名 | 用途 |
|---|---|
| CloudCRM Pro | CRM |
| DataSync Hub | データ同期 |
| AI Analytics | 分析 |

### metrics_definitions（メトリクス定義マスタ）

製品ごとの従量課金指標を定義する。

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",
  "metric_code": "string",
  "metric_name": "string",
  "unit": "string",
  "description": "string",
  "is_active": true,
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### plans（課金プランマスタ）

プラン別の料金・閾値・メトリクス上限を管理する。

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",
  "plan_code": "string",
  "plan_name": "string",
  "monthly_base_fee": "number",
  "alert_threshold_pct": "number",
  "metric_limits": [
    {
      "metric_code": "string",
      "limit_value": "number",
      "overage_unit_price": "number"
    }
  ],
  "is_active": true,
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

現行の課金プラン（Excel「課金プラン一覧」シートより）では、`metric_limits` に API呼出上限やストレージ上限を保持する。閾値は原則 90% を初期値とし、管理者が変更できる。

### customers（顧客マスタ）

契約主体の情報を管理する。

```json
{
  "_id": "ObjectId",
  "customer_code": "string",
  "customer_name": "string",
  "assigned_sales_user_id": "ObjectId",
  "contact_person": "string",
  "notes": "string",
  "is_active": true,
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

### contracts（契約）

顧客ごとの契約内容を管理する。

```json
{
  "_id": "ObjectId",
  "customer_id": "ObjectId",
  "product_id": "ObjectId",
  "current_plan_id": "ObjectId",
  "contract_start_date": "date",
  "contract_end_date": "date",
  "contract_renewal_date": "date",
  "license_count": "number",
  "status": "active | renewing | suspended | terminated",
  "primary_use_case": "sales_ops | customer_support | analytics | integration | other",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

`primary_use_case` はダッシュボードの「利用目的別サマリ」に利用する。営業向けの表示名は日本語ラベルに変換する。

### contract_plan_history（契約変更履歴）

プラン変更、ライセンス変更、月中単価変更の履歴を保持する。

```json
{
  "_id": "ObjectId",
  "contract_id": "ObjectId",
  "plan_id": "ObjectId",
  "effective_from": "date",
  "effective_to": "date | null",
  "monthly_base_fee_snapshot": "number",
  "metric_limits_snapshot": [
    {
      "metric_code": "string",
      "limit_value": "number",
      "overage_unit_price": "number"
    }
  ],
  "license_count_snapshot": "number",
  "change_reason": "string",
  "changed_by_user_id": "ObjectId",
  "created_at": "datetime (UTC)"
}
```

Phase 1 では履歴の記録までを必須とし、自動按分は行わない。月中変更がある場合は、月次確定前に管理者が最終値を確認する。

### monthly_usage（月次従量実績）

月次の従量課金データを格納する。CSVインポートまたは将来のAPI連携で投入される。

```json
{
  "_id": "ObjectId",
  "contract_id": "ObjectId",
  "customer_id": "ObjectId",
  "product_id": "ObjectId",
  "billing_month": "string (YYYY-MM)",
  "metric_code": "string",
  "actual_value": "number",
  "limit_value_snapshot": "number",
  "usage_rate": "number",
  "overage_count": "number",
  "overage_fee": "number",
  "import_id": "ObjectId",
  "calculation_status": "draft | confirmed",
  "imported_at": "datetime (UTC)",
  "confirmed_at": "datetime (UTC) | null"
}
```

### usage_imports（取込履歴）

CSV取込の実行履歴と検証結果を保持する。

```json
{
  "_id": "ObjectId",
  "billing_month": "string (YYYY-MM)",
  "source_type": "csv | api",
  "file_name": "string",
  "file_hash": "string",
  "replace_mode": true,
  "status": "uploaded | validated | confirmed | failed | cancelled",
  "uploaded_by_user_id": "ObjectId",
  "error_count": "number",
  "error_summary": "string",
  "created_at": "datetime (UTC)",
  "confirmed_at": "datetime (UTC) | null"
}
```

### audit_logs（監査ログ）

管理操作と重要データ更新の監査証跡を保持する。

```json
{
  "_id": "ObjectId",
  "actor_user_id": "ObjectId",
  "resource_type": "string",
  "resource_id": "ObjectId | string",
  "action": "create | update | deactivate | import_confirm | import_replace",
  "before": "object | null",
  "after": "object | null",
  "created_at": "datetime (UTC)"
}
```

## 主な制約・バリデーション

| 対象 | ルール |
|---|---|
| users | `email` は一意、`role` は `sales` または `admin` |
| products | `product_code` は一意、論理削除のみ許可 |
| metrics_definitions | `(product_id, metric_code)` を一意とする |
| plans | `(product_id, plan_code)` を一意とし、`alert_threshold_pct` は 1〜100 |
| customers | `customer_code` は一意、担当営業は `users.role = sales` のみ設定可 |
| contracts | 同一顧客・同一製品で `status = active` の契約は1件まで |
| contract_plan_history | `effective_from < effective_to`（`effective_to` がある場合） |
| monthly_usage | `(contract_id, billing_month, metric_code)` を一意とする |
| usage_imports | 同一 `billing_month` の再取込は `replace_mode = true` のみ許可 |

## インデックス方針

- `users.email` にユニークインデックス
- `products.product_code` にユニークインデックス
- `metrics_definitions(product_id, metric_code)` にユニークインデックス
- `plans(product_id, plan_code)` にユニークインデックス
- `customers.customer_code`、`customers.assigned_sales_user_id` にインデックス
- `contracts(customer_id, product_id, status)` に複合インデックス
- `monthly_usage(contract_id, billing_month, metric_code)` にユニークインデックス
- `usage_imports(billing_month, status)` にインデックス

## コレクション間のリレーション

```
users ──1:N──> customers
products ──1:N──> metrics_definitions
products ──1:N──> plans
customers ──1:N──> contracts ──1:N──> contract_plan_history
contracts ──1:N──> monthly_usage
usage_imports ──1:N──> monthly_usage
audit_logs ──> users / contracts / monthly_usage / usage_imports
```
