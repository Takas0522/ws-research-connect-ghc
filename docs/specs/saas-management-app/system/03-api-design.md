# REST API エンドポイント設計

## 共通仕様

### ベース URL

```
http://localhost:5010/api
```

### レスポンス形式

- Content-Type: `application/json`
- 日付: ISO 8601 形式（`2026-03-22T09:00:00Z`）
- 金額: 整数（円単位）

### エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "製品名は必須です",
    "details": [
      { "field": "name", "message": "必須項目です" }
    ]
  }
}
```

### ステータスコード

| コード | 用途 |
|--------|------|
| 200 | 取得・更新成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 404 | リソースが見つからない |
| 409 | 競合（重複登録等） |
| 500 | サーバーエラー |

---

## 製品 API

### GET /api/products

製品一覧を取得する。

**レスポンス**:
```json
[
  {
    "id": "uuid",
    "name": "CloudSync Pro",
    "category": "コラボレーション",
    "summary": "ファイル同期・共有プラットフォーム",
    "status": "active",
    "launchedAt": "2022-04-01",
    "planCount": 3,
    "activeContractCount": 3
  }
]
```

### GET /api/products/{id}

製品詳細を取得する（プラン一覧を含む）。

**レスポンス**:
```json
{
  "id": "uuid",
  "name": "CloudSync Pro",
  "category": "コラボレーション",
  "summary": "ファイル同期・共有プラットフォーム",
  "status": "active",
  "launchedAt": "2022-04-01",
  "plans": [
    {
      "id": "uuid",
      "name": "Starter",
      "monthlyFee": 5000,
      "unitPrice": null,
      "freeTierQuantity": 5,
      "freeTierUnit": "ユーザー",
      "billingCycleDiscount": 10.0,
      "note": "年契10%OFF"
    }
  ]
}
```

### POST /api/products

製品を新規登録する。

**リクエスト**:
```json
{
  "name": "新製品名",
  "category": "カテゴリ",
  "summary": "概要",
  "status": "beta",
  "launchedAt": "2026-04-01"
}
```

### PUT /api/products/{id}

製品情報を更新する。

**リクエスト**: POST と同一形式

---

## 課金プラン API

### POST /api/products/{productId}/plans

製品にプランを追加する。

**リクエスト**:
```json
{
  "name": "Enterprise",
  "monthlyFee": 50000,
  "unitPrice": null,
  "freeTierQuantity": null,
  "freeTierUnit": null,
  "billingCycleDiscount": null,
  "note": "SLA 99.9%"
}
```

### PUT /api/plans/{id}

プラン情報を更新する。

---

## 顧客 API

### GET /api/customers

顧客一覧を取得する。

**レスポンス**:
```json
[
  {
    "id": "uuid",
    "code": "CST-001",
    "name": "ABC商事",
    "activeContractCount": 2,
    "monthlyTotal": 26400
  }
]
```

### GET /api/customers/{id}

顧客詳細を取得する（契約一覧・利用実績を含む）。

**レスポンス**:
```json
{
  "id": "uuid",
  "code": "CST-001",
  "name": "ABC商事",
  "contact": "...",
  "note": "...",
  "contracts": [
    {
      "id": "uuid",
      "productName": "CloudSync Pro",
      "planName": "Business",
      "contractType": "yearly",
      "startDate": "2023-04-01",
      "status": "active",
      "latestUsage": {
        "yearMonth": "2026-03",
        "usageQuantity": 45,
        "billingAmount": 15000
      }
    }
  ]
}
```

### POST /api/customers

顧客を新規登録する。

**リクエスト**:
```json
{
  "code": "CST-008",
  "name": "新規顧客名",
  "contact": "連絡先",
  "note": "備考"
}
```

### PUT /api/customers/{id}

顧客情報を更新する。

---

## 契約 API

### GET /api/contracts

契約一覧を取得する。クエリパラメータでフィルタ可能。

**クエリパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| customerId | UUID | 顧客で絞り込み |
| productId | UUID | 製品で絞り込み |
| status | string | `active` / `cancelled` |

**レスポンス**:
```json
[
  {
    "id": "uuid",
    "customerName": "ABC商事",
    "productName": "CloudSync Pro",
    "planName": "Business",
    "contractType": "yearly",
    "startDate": "2023-04-01",
    "endDate": null,
    "status": "active"
  }
]
```

### POST /api/contracts

契約を新規登録する。

**リクエスト**:
```json
{
  "customerId": "uuid",
  "productId": "uuid",
  "planId": "uuid",
  "contractType": "monthly",
  "startDate": "2026-04-01"
}
```

**バリデーション**:
- 同一顧客・同一製品でアクティブな契約がないこと（409 を返す）
- planId が指定 productId に属すること

### PUT /api/contracts/{id}/plan

契約のプランを変更する。変更履歴を自動記録する。

**リクエスト**:
```json
{
  "newPlanId": "uuid",
  "reason": "利用量増加のためアップグレード"
}
```

**処理**:
1. 現在のプランを `old_plan_id` として ContractHistory に記録
2. 契約の `plan_id` を更新

### POST /api/contracts/{id}/cancel

契約を解約する。

**リクエスト**:
```json
{
  "reason": "サービス利用終了のため",
  "endDate": "2026-03-31"
}
```

### GET /api/contracts/{id}/history

契約の変更履歴を取得する。

**レスポンス**:
```json
[
  {
    "id": "uuid",
    "changeType": "plan_change",
    "oldPlanName": "Standard",
    "newPlanName": "Premium",
    "reason": "利用量増加のため",
    "changedAt": "2026-02-15T10:00:00Z"
  }
]
```

---

## 利用実績 API

### GET /api/usages

利用実績一覧を取得する。

**クエリパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| contractId | UUID | 契約で絞り込み |
| customerId | UUID | 顧客で絞り込み |
| productId | UUID | 製品で絞り込み |
| from | string | 開始月（YYYY-MM） |
| to | string | 終了月（YYYY-MM） |

### POST /api/usages

月次利用実績を登録する（UPSERT）。請求額を自動計算して保存する。

**リクエスト**:
```json
{
  "contractId": "uuid",
  "yearMonth": "2026-03",
  "usageQuantity": 162
}
```

**レスポンス** (201 or 200):
```json
{
  "id": "uuid",
  "contractId": "uuid",
  "yearMonth": "2026-03",
  "usageQuantity": 162,
  "billingAmount": 13100
}
```

### POST /api/usages/bulk

複数件の利用実績を一括登録する。

**リクエスト**:
```json
{
  "usages": [
    { "contractId": "uuid", "yearMonth": "2026-03", "usageQuantity": 162 },
    { "contractId": "uuid", "yearMonth": "2026-03", "usageQuantity": 295 }
  ]
}
```

---

## トライアル API

### GET /api/trials

トライアル一覧を取得する。

**クエリパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| status | string | `active` / `converted` / `expired` / `cancelled` |
| customerId | UUID | 顧客で絞り込み |

**レスポンス**:
```json
[
  {
    "id": "uuid",
    "customerName": "新規顧客",
    "productName": "BizFlow",
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "remainingDays": 9,
    "restrictionLevel": "capacity_limited",
    "status": "active"
  }
]
```

### POST /api/trials

トライアルを開始する。

**リクエスト**:
```json
{
  "customerId": "uuid",
  "productId": "uuid",
  "startDate": "2026-04-01",
  "endDate": "2026-04-14",
  "restrictionLevel": "capacity_limited"
}
```

**バリデーション**:
- 同一顧客・同一製品でアクティブなトライアルがないこと

### POST /api/trials/{id}/convert

トライアルを本契約に転換する。

**リクエスト**:
```json
{
  "planId": "uuid",
  "contractType": "monthly"
}
```

**処理**:
1. トライアルの status を `converted` に変更
2. 新規契約を作成（開始日 = 転換日）
3. `converted_contract_id` に新規契約 ID を設定

### POST /api/trials/{id}/cancel

トライアルをキャンセルする。

### POST /api/trials/expire

期限切れトライアルを一括処理する（バッチ用）。

---

## ダッシュボード API

### GET /api/dashboard/revenue

月次売上推移を取得する。

**クエリパラメータ**:
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| from | string | 開始月（YYYY-MM） |
| to | string | 終了月（YYYY-MM） |

**レスポンス**:
```json
{
  "months": [
    {
      "yearMonth": "2026-01",
      "totalRevenue": 523830,
      "byProduct": [
        { "productName": "CloudSync Pro", "revenue": 85000 },
        { "productName": "SecureGate", "revenue": 132000 }
      ]
    }
  ]
}
```

### GET /api/dashboard/customers

顧客別サマリを取得する。

**レスポンス**:
```json
[
  {
    "customerId": "uuid",
    "customerName": "XYZホールディングス",
    "contractCount": 3,
    "latestMonthlyTotal": 152600,
    "trend": "increasing"
  }
]
```

### GET /api/dashboard/trials

トライアル KPI を取得する。

**レスポンス**:
```json
{
  "activeTrials": 3,
  "convertedThisMonth": 1,
  "expiredThisMonth": 0,
  "conversionRate": 75.0,
  "expiringWithin7Days": [
    {
      "customerName": "新規顧客",
      "productName": "BizFlow",
      "remainingDays": 3,
      "usageLevel": "high"
    }
  ]
}
```
