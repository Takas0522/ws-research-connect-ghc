---
description: 'MongoDB 7 のコレクション設計・インデックス設計・初期化スクリプトの規約'
applyTo: 'src/database/**'
---

# MongoDB 設計規約

## コレクション命名

- 複数形・スネークケース: `products`, `plans`, `customers`, `contracts`, `monthly_usage`, `metrics_definitions`

## ドキュメント設計

- `_id`: MongoDB デフォルトの `ObjectId` を使用する
- タイムスタンプ: `created_at`, `updated_at` を全コレクションに含める
- 参照: 他コレクションへの参照は `ObjectId` 型で保持する (例: `product_id: ObjectId`)
- 更新時は `$set` + `updated_at: datetime.now(timezone.utc)` を使用する

## コレクション間のリレーション

```
products ──1:N──> plans
products ──1:N──> metrics_definitions
customers ──1:N──> contracts ──> products, plans
customers ──1:N──> monthly_usage ──> products
```

## インデックス設計

| コレクション | フィールド | 種類 | 用途 |
|------------|----------|------|------|
| `products` | `product_code` | unique | 製品コードの一意性 |
| `customers` | `customer_code` | unique | 顧客コードの一意性 |
| `contracts` | `customer_id` | single | 顧客別契約検索 |
| `contracts` | `status` | single | ステータス別フィルタ |
| `monthly_usage` | `(customer_id, product_id, year_month)` | compound | 月次従量データ検索 |
| `plans` | `product_id` | single | 製品別プラン検索 |

## 初期化スクリプト

`src/database/init/` に配置する JavaScript ファイルは Docker Compose の `docker-entrypoint-initdb.d` にマウントされ、MongoDB 初回起動時に自動実行される。

```javascript
// src/database/init/01-create-indexes.js
db = db.getSiblingDB('saas_management');

db.products.createIndex({ product_code: 1 }, { unique: true });
db.customers.createIndex({ customer_code: 1 }, { unique: true });
db.monthly_usage.createIndex(
  { customer_id: 1, product_id: 1, year_month: 1 },
  { unique: true }
);
```

## データモデル参照

詳細なフィールド定義は `docs/specs/saas-management-app/system/03-data-model.md` を参照する。

## Validation

- 接続確認: `mongosh mongodb://localhost:27017/saas_management --eval "db.stats()"`
- コレクション一覧: `mongosh mongodb://localhost:27017/saas_management --eval "db.getCollectionNames()"`
- インデックス確認: `mongosh mongodb://localhost:27017/saas_management --eval "db.products.getIndexes()"`
