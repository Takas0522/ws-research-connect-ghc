-- SaaS管理アプリ データベーススキーマ
-- This file runs automatically on first PostgreSQL startup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM 型定義
-- ============================================================

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'beta', 'discontinued');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('active', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_change_type AS ENUM ('plan_change', 'cancellation', 'type_change');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE trial_restriction AS ENUM ('full', 'feature_limited', 'capacity_limited');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE trial_status AS ENUM ('active', 'converted', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- テーブル定義
-- ============================================================

-- 製品マスタ
CREATE TABLE IF NOT EXISTS products (
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

-- 課金プラン
CREATE TABLE IF NOT EXISTS plans (
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

CREATE INDEX IF NOT EXISTS idx_plans_product_id ON plans(product_id);

COMMENT ON TABLE plans IS '製品ごとの課金プラン';
COMMENT ON COLUMN plans.unit_price IS '従量単価（NULL = 固定料金型）';
COMMENT ON COLUMN plans.free_tier_quantity IS '無料枠（NULL = 無料枠なし）';
COMMENT ON COLUMN plans.billing_cycle_discount IS '年契割引率（%）';

-- 顧客マスタ
CREATE TABLE IF NOT EXISTS customers (
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

-- 契約
CREATE TABLE IF NOT EXISTS contracts (
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

CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_product_id ON contracts(product_id);
CREATE INDEX IF NOT EXISTS idx_contracts_plan_id ON contracts(plan_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- 同一顧客・同一製品でアクティブな契約は1件のみ
CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_active_per_customer_product
    ON contracts(customer_id, product_id)
    WHERE status = 'active';

COMMENT ON TABLE contracts IS '顧客と製品・プランの契約';
COMMENT ON COLUMN contracts.end_date IS '契約終了日（NULL = 継続中）';

-- 契約変更履歴
CREATE TABLE IF NOT EXISTS contract_histories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id     UUID NOT NULL REFERENCES contracts(id),
    change_type     contract_change_type NOT NULL,
    old_plan_id     UUID REFERENCES plans(id),
    new_plan_id     UUID REFERENCES plans(id),
    reason          TEXT,
    changed_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_histories_contract_id ON contract_histories(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_histories_changed_at ON contract_histories(changed_at);

COMMENT ON TABLE contract_histories IS '契約のプラン変更・解約等の変更履歴';

-- 月次利用実績
CREATE TABLE IF NOT EXISTS monthly_usages (
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

CREATE INDEX IF NOT EXISTS idx_monthly_usages_contract_id ON monthly_usages(contract_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usages_year_month ON monthly_usages(year_month);

COMMENT ON TABLE monthly_usages IS '月次利用実績と請求額';
COMMENT ON COLUMN monthly_usages.year_month IS '対象月（YYYY-MM 形式）';
COMMENT ON COLUMN monthly_usages.billing_amount IS '自動計算された請求額（円）';

-- トライアル
CREATE TABLE IF NOT EXISTS trials (
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

CREATE INDEX IF NOT EXISTS idx_trials_customer_id ON trials(customer_id);
CREATE INDEX IF NOT EXISTS idx_trials_product_id ON trials(product_id);
CREATE INDEX IF NOT EXISTS idx_trials_status ON trials(status);

-- 同一顧客・同一製品でアクティブなトライアルは1件のみ
CREATE UNIQUE INDEX IF NOT EXISTS uq_trials_active_per_customer_product
    ON trials(customer_id, product_id)
    WHERE status = 'active';

COMMENT ON TABLE trials IS '製品トライアル（無料試用）';
COMMENT ON COLUMN trials.converted_contract_id IS '本契約に転換した場合の契約ID';

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_monthly_usages_updated_at BEFORE UPDATE ON monthly_usages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_trials_updated_at BEFORE UPDATE ON trials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
