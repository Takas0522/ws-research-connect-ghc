# ドメインモデル・用語定義

## 用語集

| 用語 | 定義 |
|------|------|
| **製品（Product）** | 自社が提供する SaaS サービスの単位。例: CloudSync Pro, DataVault |
| **課金プラン（Plan）** | 製品に紐づく料金体系の単位。例: Starter, Business, Enterprise |
| **顧客（Customer）** | SaaS 製品を契約する法人 |
| **契約（Contract）** | 顧客が特定の製品・プランを利用する合意。月契・年契の形態を持つ |
| **月次利用実績（MonthlyUsage）** | ある月における契約の利用量データ |
| **請求額（BillingAmount）** | プランの課金ルールと利用量から算出される月次請求金額 |
| **契約変更履歴（ContractHistory）** | プラン変更・解約などの契約状態の変更記録 |
| **トライアル（Trial）** | 顧客が本契約前に無料で製品を試用できる期間 |
| **従量課金（Usage-Based Billing）** | 利用量に応じて課金される方式 |
| **固定料金（Flat-Rate）** | 利用量に関わらず月額固定の課金方式 |

## ドメインモデル（ER 図）

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│ Product  │1    N │    Plan      │       │  Customer   │
│──────────│───────│──────────────│       │─────────────│
│ id       │       │ id           │       │ id          │
│ name     │       │ product_id   │       │ code        │
│ category │       │ name         │       │ name        │
│ summary  │       │ monthly_fee  │       │ contact     │
│ status   │       │ unit_price   │       │ note        │
│ launched │       │ free_tier    │       │ created_at  │
│ created  │       │ note         │       │ updated_at  │
│ updated  │       │ created_at   │       └──────┬──────┘
└──────────┘       │ updated_at   │              │
                   └──────┬───────┘              │
                          │                      │
                          │N                   1 │
                   ┌──────┴───────┐              │
                   │  Contract    │──────────────┘
                   │──────────────│
                   │ id           │
                   │ customer_id  │
                   │ product_id   │
                   │ plan_id      │
                   │ type (月/年) │
                   │ start_date   │
                   │ end_date     │
                   │ status       │
                   │ created_at   │
                   │ updated_at   │
                   └──────┬───────┘
                          │
              ┌───────────┼───────────┐
              │1        N │         N │
     ┌────────┴────────┐  │  ┌───────┴──────────┐
     │ ContractHistory │  │  │  MonthlyUsage    │
     │─────────────────│  │  │──────────────────│
     │ id              │  │  │ id               │
     │ contract_id     │  │  │ contract_id      │
     │ change_type     │  │  │ year_month       │
     │ old_plan_id     │  │  │ usage_quantity   │
     │ new_plan_id     │  │  │ billing_amount   │
     │ reason          │  │  │ created_at       │
     │ changed_at      │  │  │ updated_at       │
     │ created_at      │  │  └──────────────────┘
     └─────────────────┘  │
                          │
                   ┌──────┴───────┐
                   │    Trial     │
                   │──────────────│
                   │ id           │
                   │ customer_id  │
                   │ product_id   │
                   │ start_date   │
                   │ end_date     │
                   │ restriction  │
                   │ status       │
                   │ converted_id │
                   │ created_at   │
                   │ updated_at   │
                   └──────────────┘
```

## エンティティ詳細

### Product（製品）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| name | VARCHAR(255) | ○ | 製品名（一意） |
| category | VARCHAR(100) | ○ | カテゴリ（コラボレーション、データ管理等） |
| summary | TEXT | × | 製品概要 |
| status | ENUM | ○ | 提供中 / ベータ / 終了 |
| launched_at | DATE | × | 提供開始日 |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

### Plan（課金プラン）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| product_id | UUID | ○ | 製品 FK |
| name | VARCHAR(255) | ○ | プラン名 |
| monthly_fee | DECIMAL(12,0) | ○ | 月額基本料（税別、円） |
| unit_price | DECIMAL(12,2) | × | 従量単価（null = 従量なし） |
| free_tier_quantity | DECIMAL(12,2) | × | 無料枠（null = 無料枠なし） |
| free_tier_unit | VARCHAR(50) | × | 無料枠単位（ユーザー、GB、件等） |
| billing_cycle_discount | DECIMAL(5,2) | × | 年契割引率（%） |
| note | TEXT | × | 備考 |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

### Customer（顧客）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| code | VARCHAR(50) | ○ | 顧客コード（一意） |
| name | VARCHAR(255) | ○ | 顧客名 |
| contact | TEXT | × | 連絡先 |
| note | TEXT | × | 備考 |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

### Contract（契約）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| customer_id | UUID | ○ | 顧客 FK |
| product_id | UUID | ○ | 製品 FK |
| plan_id | UUID | ○ | 現行プラン FK |
| contract_type | ENUM | ○ | 月契 / 年契 |
| start_date | DATE | ○ | 契約開始日 |
| end_date | DATE | × | 契約終了日（null = 継続中） |
| status | ENUM | ○ | 有効 / 解約済み |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

### ContractHistory（契約変更履歴）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| contract_id | UUID | ○ | 契約 FK |
| change_type | ENUM | ○ | プラン変更 / 解約 / 契約形態変更 |
| old_plan_id | UUID | × | 変更前プラン FK |
| new_plan_id | UUID | × | 変更後プラン FK |
| reason | TEXT | × | 変更理由 |
| changed_at | TIMESTAMPTZ | ○ | 変更日時 |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |

### MonthlyUsage（月次利用実績）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| contract_id | UUID | ○ | 契約 FK |
| year_month | VARCHAR(7) | ○ | 対象月（YYYY-MM 形式） |
| usage_quantity | DECIMAL(12,2) | ○ | 利用量 |
| billing_amount | DECIMAL(12,0) | ○ | 請求額（自動計算） |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

**一意制約**: (contract_id, year_month)

### Trial（トライアル）

| 属性 | 型 | 必須 | 説明 |
|------|------|------|------|
| id | UUID | ○ | 主キー |
| customer_id | UUID | ○ | 顧客 FK |
| product_id | UUID | ○ | 製品 FK |
| start_date | DATE | ○ | トライアル開始日 |
| end_date | DATE | ○ | トライアル終了日 |
| restriction_level | ENUM | ○ | 制限なし / 機能制限 / 容量制限 |
| status | ENUM | ○ | 進行中 / 転換済み / 期限切れ / キャンセル |
| converted_contract_id | UUID | × | 転換先の契約 FK |
| created_at | TIMESTAMPTZ | ○ | 作成日時 |
| updated_at | TIMESTAMPTZ | ○ | 更新日時 |

## ステータス遷移

### 契約ステータス

```
[新規作成] → 有効 → 解約済み
```

### トライアルステータス

```
[新規作成] → 進行中 → 転換済み（本契約化）
                    → 期限切れ（自動）
                    → キャンセル（手動）
```
