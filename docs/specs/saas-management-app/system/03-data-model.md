# データモデル・マスタ設計

## マスタデータ設計方針

大川氏の提案に基づき、まず製品名やプラン名のマスタデータを正規化する。現状のExcel運用では表記揺れが頻発しており、マスタテーブルの設計から入ることでデータ不整合を防止する。

## コレクション設計（MongoDB）

### products（製品マスタ）

SaaS製品の基本情報を管理する。

```json
{
  "_id": "ObjectId",
  "product_code": "string",    // 製品コード（ユニーク）
  "product_name": "string",    // 製品名（例: "CloudCRM Pro"）
  "category": "string",        // カテゴリ
  "vendor": "string",          // ベンダー
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

現行データに基づく製品一覧：

| 製品名 | 用途 |
|---|---|
| CloudCRM Pro | CRM |
| DataSync Hub | データ同期 |
| AI Analytics | 分析 |

### plans（課金プランマスタ）

プラン別の料金・上限値を管理する。

```json
{
  "_id": "ObjectId",
  "product_id": "ObjectId",       // 製品への参照
  "plan_name": "string",          // プラン名（例: "Enterprise"）
  "monthly_base_fee": "number",   // 月額基本料（円）
  "license_limit": "number",      // ライセンス上限
  "api_call_limit": "number",     // API呼出上限（/月）
  "storage_limit_gb": "number",   // ストレージ上限（GB）
  "overage_unit_price": "number", // 超過単価（円/件）
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

現行の課金プラン（Excel「課金プラン一覧」シートより）：

| SaaS製品名 | プラン名 | 月額基本料(円) | ライセンス上限 | API呼出上限(/月) | ストレージ上限(GB) | 超過単価(円/件) |
|---|---|---|---|---|---|---|
| CloudCRM Pro | Starter | 98,000 | 25 | 50,000 | 10 | 2.5 |
| CloudCRM Pro | Business | 280,000 | 100 | 200,000 | 50 | 2.0 |
| CloudCRM Pro | Enterprise | 480,000 | 300 | 500,000 | 200 | 1.5 |
| DataSync Hub | Starter | 85,000 | 20 | 30,000 | 5 | 3.0 |
| DataSync Hub | Standard | 150,000 | 50 | 100,000 | 30 | 2.5 |
| DataSync Hub | Enterprise | 350,000 | 200 | 300,000 | 100 | 1.8 |
| AI Analytics | Professional | 220,000 | 50 | 80,000 | 20 | 4.0 |
| AI Analytics | Enterprise | 520,000 | 300 | 250,000 | 150 | 3.0 |

### metrics_definitions（メトリクス定義マスタ）

従量課金の指標を柔軟に定義する。新しい課金指標が増えても柔軟に対応可能（大川氏の設計意図）。

```json
{
  "_id": "ObjectId",
  "metric_code": "string",     // 指標コード（例: "api_calls"）
  "metric_name": "string",     // 指標名（例: "API呼出数"）
  "unit": "string",            // 単位（例: "回"、"GB"）
  "description": "string",
  "created_at": "datetime"
}
```

### customers（顧客マスタ）

契約主体の情報を管理する。

```json
{
  "_id": "ObjectId",
  "customer_code": "string",    // 顧客コード（ユニーク）
  "customer_name": "string",    // 顧客名
  "contact_person": "string",   // 担当者名
  "assigned_sales": "string",   // 営業担当者
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### contracts（契約）

顧客ごとの契約内容を管理する。

```json
{
  "_id": "ObjectId",
  "customer_id": "ObjectId",       // 顧客への参照
  "product_id": "ObjectId",        // 製品への参照
  "plan_id": "ObjectId",           // プランへの参照
  "contract_start_date": "date",   // 契約開始日
  "contract_renewal_date": "date", // 契約更新日
  "license_count": "number",       // ライセンス数
  "status": "string",              // 契約中 / 更新手続中 / 解約
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### monthly_usage（月次従量実績）

月次の従量課金データを格納する。CSVインポートまたは将来のAPI連携で投入される。

```json
{
  "_id": "ObjectId",
  "customer_id": "ObjectId",     // 顧客への参照
  "product_id": "ObjectId",      // 製品への参照
  "year_month": "string",        // 対象月（例: "2026/03"）
  "metric_code": "string",       // メトリクスコード（例: "api_calls"）
  "actual_value": "number",      // 実績値
  "limit_value": "number",       // 上限値
  "usage_rate": "number",        // 使用率（%）
  "overage_count": "number",     // 超過件数
  "overage_fee": "number",       // 超過料金（円）
  "imported_at": "datetime",     // 取込日時
  "import_source": "string"      // 取込元（"csv" / "api"）
}
```

## コレクション間のリレーション

```
products ──1:N──> plans
products ──1:N──> metrics_definitions
customers ──1:N──> contracts ──> products, plans
customers ──1:N──> monthly_usage ──> products
```
