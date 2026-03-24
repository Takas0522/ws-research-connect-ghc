# データベーススキーマ設計

## 概要

既存の `001_init.sql` を拡張し、SaaS管理アプリのスキーマを定義する。
UUID 主キーと `TIMESTAMPTZ` タイムスタンプを標準とし、`uuid-ossp` 拡張は導入済み。

## ENUM 型定義

```sql
-- 製品ステータス
CREATE TYPE product_status AS ENUM ('active', 'beta', 'discontinued');

-- 契約形態
CREATE TYPE contract_type AS ENUM ('monthly', 'yearly');

-- 契約ステータス
CREATE TYPE contract_status AS ENUM ('active', 'cancelled');

-- 契約変更種別
CREATE TYPE contract_change_type AS ENUM ('plan_change', 'cancellation', 'type_change');

-- トライアル制限レベル
CREATE TYPE trial_restriction AS ENUM ('full', 'feature_limited', 'capacity_limited');

-- トライアルステータス
CREATE TYPE trial_status AS ENUM ('active', 'converted', 'expired', 'cancelled');
```

## テーブル定義

### products（製品）

```sql
CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    summary     TEXT,
    status      product_status NOT NULL DEFAULT 'active',
    launched_at DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_products_name UNIQUE (name)
);

COMMENT ON TABLE products IS '自社 SaaS 製品マスタ';
```

### plans（課金プラン）

```sql
CREATE TABLE plans (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES products(id),
    name                    VARCHAR(255) NOT NULL,
    monthly_fee             DECIMAL(12, 0) NOT NULL DEFAULT 0,
    unit_price              DECIMAL(12, 2),
    free_tier_quantity      DECIMAL(12, 2),
    free_tier_unit          VARCHAR(50),
    billing_cycle_discount  DECIMAL(5, 2),
    note                    TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_plans_product_name UNIQUE (product_id, name),
    CONSTRAINT chk_plans_monthly_fee CHECK (monthly_fee >= 0),
    CONSTRAINT chk_plans_unit_price CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_plans_free_tier CHECK (free_tier_quantity IS NULL OR free_tier_quantity >= 0),
    CONSTRAINT chk_plans_discount CHECK (billing_cycle_discount IS NULL OR (billing_cycle_discount >= 0 AND billing_cycle_discount <= 100))
);

CREATE INDEX idx_plans_product_id ON plans(product_id);

COMMENT ON TABLE plans IS '製品ごとの課金プラン';
COMMENT ON COLUMN plans.unit_price IS '従量単価（NULL = 固定料金型）';
COMMENT ON COLUMN plans.free_tier_quantity IS '無料枠（NULL = 無料枠なし）';
COMMENT ON COLUMN plans.billing_cycle_discount IS '年契割引率（%）';
```

### customers（顧客）

```sql
CREATE TABLE customers (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    contact     TEXT,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customers_code UNIQUE (code)
);

COMMENT ON TABLE customers IS '顧客マスタ';
```

### contracts（契約）

```sql
CREATE TABLE contracts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    plan_id         UUID NOT NULL REFERENCES plans(id),
    contract_type   contract_type NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    status          contract_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_contracts_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX idx_contracts_product_id ON contracts(product_id);
CREATE INDEX idx_contracts_plan_id ON contracts(plan_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- 同一顧客・同一製品でアクティブな契約は1件のみ
CREATE UNIQUE INDEX uq_contracts_active_per_customer_product
    ON contracts(customer_id, product_id)
    WHERE status = 'active';

COMMENT ON TABLE contracts IS '顧客と製品・プランの契約';
COMMENT ON COLUMN contracts.end_date IS '契約終了日（NULL = 継続中）';
```

### contract_histories（契約変更履歴）

```sql
CREATE TABLE contract_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id     UUID NOT NULL REFERENCES contracts(id),
    change_type     contract_change_type NOT NULL,
    old_plan_id     UUID REFERENCES plans(id),
    new_plan_id     UUID REFERENCES plans(id),
    reason          TEXT,
    changed_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_histories_contract_id ON contract_histories(contract_id);
CREATE INDEX idx_contract_histories_changed_at ON contract_histories(changed_at);

COMMENT ON TABLE contract_histories IS '契約のプラン変更・解約等の変更履歴';
```

### monthly_usages（月次利用実績）

```sql
CREATE TABLE monthly_usages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id     UUID NOT NULL REFERENCES contracts(id),
    year_month      VARCHAR(7) NOT NULL,
    usage_quantity  DECIMAL(12, 2) NOT NULL DEFAULT 0,
    billing_amount  DECIMAL(12, 0) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_monthly_usages_contract_month UNIQUE (contract_id, year_month),
    CONSTRAINT chk_monthly_usages_year_month CHECK (year_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT chk_monthly_usages_quantity CHECK (usage_quantity >= 0),
    CONSTRAINT chk_monthly_usages_amount CHECK (billing_amount >= 0)
);

CREATE INDEX idx_monthly_usages_contract_id ON monthly_usages(contract_id);
CREATE INDEX idx_monthly_usages_year_month ON monthly_usages(year_month);

COMMENT ON TABLE monthly_usages IS '月次利用実績と請求額';
COMMENT ON COLUMN monthly_usages.year_month IS '対象月（YYYY-MM 形式）';
COMMENT ON COLUMN monthly_usages.billing_amount IS '自動計算された請求額（円）';
```

### trials（トライアル）

```sql
CREATE TABLE trials (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id             UUID NOT NULL REFERENCES customers(id),
    product_id              UUID NOT NULL REFERENCES products(id),
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    restriction_level       trial_restriction NOT NULL DEFAULT 'capacity_limited',
    status                  trial_status NOT NULL DEFAULT 'active',
    converted_contract_id   UUID REFERENCES contracts(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_trials_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_trials_customer_id ON trials(customer_id);
CREATE INDEX idx_trials_product_id ON trials(product_id);
CREATE INDEX idx_trials_status ON trials(status);

-- 同一顧客・同一製品でアクティブなトライアルは1件のみ
CREATE UNIQUE INDEX uq_trials_active_per_customer_product
    ON trials(customer_id, product_id)
    WHERE status = 'active';

COMMENT ON TABLE trials IS '製品トライアル（無料試用）';
COMMENT ON COLUMN trials.converted_contract_id IS '本契約に転換した場合の契約ID';
```

## 更新トリガー

```sql
-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに適用
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_monthly_usages_updated_at BEFORE UPDATE ON monthly_usages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_trials_updated_at BEFORE UPDATE ON trials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 初期データ（シード）

開発・テスト用のシードデータは、現行 Excel（SaaS契約管理表.xlsx）の内容をベースに投入する。

- 製品 7 件
- プラン 14 件
- 顧客 7 社
- 契約 15 件
- 月次利用実績（1〜3月）45 件

シードデータの SQL は開発フェーズで別途作成する。
