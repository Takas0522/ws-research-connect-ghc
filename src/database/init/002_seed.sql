-- SaaS管理アプリ シードデータ
-- 開発・テスト用の初期データ（冪等: ON CONFLICT DO NOTHING）

-- ============================================================
-- 製品マスタ（7件）
-- ============================================================

INSERT INTO products (id, name, category, summary, status, launched_at) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'CloudSync Pro', 'コラボレーション', 'ファイル同期・共有プラットフォーム', 'active', '2022-04-01'),
    ('a0000001-0000-0000-0000-000000000002', 'DataVault', 'データ管理', 'セキュアなデータストレージ・管理ソリューション', 'active', '2022-08-01'),
    ('a0000001-0000-0000-0000-000000000003', 'BizFlow', 'ワークフロー', 'ビジネスプロセス自動化ツール', 'active', '2023-01-01'),
    ('a0000001-0000-0000-0000-000000000004', 'InsightDash', 'BI・分析', 'ビジネスインテリジェンス・ダッシュボード', 'active', '2023-06-01'),
    ('a0000001-0000-0000-0000-000000000005', 'SecureGate', 'セキュリティ', 'ID管理・アクセス制御ソリューション', 'active', '2024-02-01'),
    ('a0000001-0000-0000-0000-000000000006', 'ChatAssist AI', 'AI・チャットボット', 'AI搭載カスタマーサポートチャットボット', 'beta', '2024-09-01'),
    ('a0000001-0000-0000-0000-000000000007', 'FormBuilder', 'ノーコード', 'ノーコードフォーム作成ツール', 'beta', '2025-01-01')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 課金プラン（14件）
-- ============================================================

-- CloudSync Pro (3プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Starter', 5000, NULL, 5, 'ユーザー', 10.00, '年契10%OFF'),
    ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Business', 15000, NULL, 50, 'ユーザー', 10.00, '年契10%OFF'),
    ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Enterprise', 50000, NULL, NULL, NULL, NULL, 'SLA 99.9%')
ON CONFLICT (product_id, name) DO NOTHING;

-- DataVault (2プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Basic', 8000, 2.00, 100, 'GB', NULL, NULL),
    ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'Pro', 25000, 1.50, 500, 'GB', NULL, NULL)
ON CONFLICT (product_id, name) DO NOTHING;

-- BizFlow (2プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'Standard', 10000, 50.00, 100, '件', NULL, NULL),
    ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'Premium', 30000, 30.00, 500, '件', NULL, NULL)
ON CONFLICT (product_id, name) DO NOTHING;

-- InsightDash (2プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004', 'Team', 12000, NULL, 5, 'ダッシュボード', NULL, NULL),
    ('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'Business', 35000, NULL, NULL, NULL, NULL, '無制限')
ON CONFLICT (product_id, name) DO NOTHING;

-- SecureGate (2プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005', 'Standard', 20000, 100.00, 50, 'ユーザー', NULL, NULL),
    ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000005', 'Advanced', 60000, 80.00, 200, 'ユーザー', NULL, NULL)
ON CONFLICT (product_id, name) DO NOTHING;

-- ChatAssist AI (1プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000006', 'Basic', 15000, 5.00, 1000, '会話', NULL, NULL)
ON CONFLICT (product_id, name) DO NOTHING;

-- FormBuilder (2プラン)
INSERT INTO plans (id, product_id, name, monthly_fee, unit_price, free_tier_quantity, free_tier_unit, billing_cycle_discount, note) VALUES
    ('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000007', 'Free', 0, NULL, 3, 'フォーム', NULL, '無料プラン'),
    ('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000007', 'Pro', 8000, NULL, NULL, NULL, NULL, '無制限')
ON CONFLICT (product_id, name) DO NOTHING;

-- ============================================================
-- 顧客マスタ（7社）
-- ============================================================

INSERT INTO customers (id, code, name, contact, note) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'CST-001', 'ABC商事', '山田太郎 03-1234-5678', '創業以来の主要顧客'),
    ('c0000001-0000-0000-0000-000000000002', 'CST-002', 'XYZホールディングス', '佐藤花子 03-2345-6789', '大口顧客、複数製品利用'),
    ('c0000001-0000-0000-0000-000000000003', 'CST-003', '田中電機', '田中一郎 06-3456-7890', '大阪支社'),
    ('c0000001-0000-0000-0000-000000000004', 'CST-004', 'グローバルテック', '鈴木次郎 03-4567-8901', 'IT企業、成長中'),
    ('c0000001-0000-0000-0000-000000000005', 'CST-005', 'みどり銀行', '高橋美咲 03-5678-9012', '金融業、セキュリティ要件厳格'),
    ('c0000001-0000-0000-0000-000000000006', 'CST-006', 'さくら物産', '伊藤健太 052-6789-0123', '名古屋本社'),
    ('c0000001-0000-0000-0000-000000000007', 'CST-007', 'テクノサービス', '渡辺理恵 03-7890-1234', '中小IT企業')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 契約（15件）
-- ============================================================

-- ABC商事: CloudSync Pro Business(年契) + BizFlow Standard(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'yearly', '2023-04-01', 'active'),
    ('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000006', 'monthly', '2023-06-01', 'active')
ON CONFLICT DO NOTHING;

-- XYZホールディングス: CloudSync Pro Enterprise(年契) + SecureGate Advanced(年契) + InsightDash Business(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', 'yearly', '2023-04-01', 'active'),
    ('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000011', 'yearly', '2024-04-01', 'active'),
    ('d0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000009', 'monthly', '2024-06-01', 'active')
ON CONFLICT DO NOTHING;

-- 田中電機: BizFlow Standard(月契) + DataVault Basic(月契) + FormBuilder Pro(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000006', 'monthly', '2023-07-01', 'active'),
    ('d0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000004', 'monthly', '2024-01-01', 'active'),
    ('d0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000014', 'monthly', '2025-02-01', 'active')
ON CONFLICT DO NOTHING;

-- グローバルテック: ChatAssist AI Basic(月契) + SecureGate Standard(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000012', 'monthly', '2024-10-01', 'active'),
    ('d0000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000010', 'monthly', '2024-06-01', 'active')
ON CONFLICT DO NOTHING;

-- みどり銀行: SecureGate Advanced(年契) + DataVault Pro(年契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000011', 'yearly', '2024-04-01', 'active'),
    ('d0000001-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000005', 'yearly', '2024-04-01', 'active')
ON CONFLICT DO NOTHING;

-- さくら物産: BizFlow Premium(月契) + CloudSync Pro Starter(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000007', 'monthly', '2024-01-01', 'active'),
    ('d0000001-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'monthly', '2024-03-01', 'active')
ON CONFLICT DO NOTHING;

-- テクノサービス: InsightDash Team(月契)
INSERT INTO contracts (id, customer_id, product_id, plan_id, contract_type, start_date, status) VALUES
    ('d0000001-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000008', 'monthly', '2024-09-01', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 月次利用実績（1〜3月分、45件 = 15契約 × 3ヶ月）
-- 請求額は仕様書の課金ロジックに基づいて計算
-- ============================================================

-- ABC商事 / CloudSync Pro Business(年契: 割引後 ¥13,500)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000001', '2026-01', 42, 13500),
    ('d0000001-0000-0000-0000-000000000001', '2026-02', 42, 13500),
    ('d0000001-0000-0000-0000-000000000001', '2026-03', 45, 13500)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- ABC商事 / BizFlow Standard(月契: ¥10,000 + 超過分×¥50)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000002', '2026-01', 135, 11750),
    ('d0000001-0000-0000-0000-000000000002', '2026-02', 145, 12250),
    ('d0000001-0000-0000-0000-000000000002', '2026-03', 162, 13100)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- XYZホールディングス / CloudSync Pro Enterprise(年契: ¥50,000 固定)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000003', '2026-01', 120, 50000),
    ('d0000001-0000-0000-0000-000000000003', '2026-02', 125, 50000),
    ('d0000001-0000-0000-0000-000000000003', '2026-03', 130, 50000)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- XYZホールディングス / SecureGate Advanced(年契: ¥60,000 + 超過分×¥80)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000004', '2026-01', 280, 66400),
    ('d0000001-0000-0000-0000-000000000004', '2026-02', 290, 67200),
    ('d0000001-0000-0000-0000-000000000004', '2026-03', 295, 67600)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- XYZホールディングス / InsightDash Business(月契: ¥35,000 固定)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000005', '2026-01', 8, 35000),
    ('d0000001-0000-0000-0000-000000000005', '2026-02', 10, 35000),
    ('d0000001-0000-0000-0000-000000000005', '2026-03', 12, 35000)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- 田中電機 / BizFlow Standard(月契)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000006', '2026-01', 480, 29000),
    ('d0000001-0000-0000-0000-000000000006', '2026-02', 520, 31000),
    ('d0000001-0000-0000-0000-000000000006', '2026-03', 558, 32900)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- 田中電機 / DataVault Basic(月契: ¥8,000 + 超過分×¥2)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000007', '2026-01', 150, 8100),
    ('d0000001-0000-0000-0000-000000000007', '2026-02', 165, 8130),
    ('d0000001-0000-0000-0000-000000000007', '2026-03', 178, 8156)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- 田中電機 / FormBuilder Pro(月契: ¥8,000 固定)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000008', '2026-01', 5, 8000),
    ('d0000001-0000-0000-0000-000000000008', '2026-02', 7, 8000),
    ('d0000001-0000-0000-0000-000000000008', '2026-03', 8, 8000)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- グローバルテック / ChatAssist AI Basic(月契: ¥15,000 + 超過分×¥5)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000009', '2026-01', 1200, 16000),
    ('d0000001-0000-0000-0000-000000000009', '2026-02', 1350, 16750),
    ('d0000001-0000-0000-0000-000000000009', '2026-03', 1500, 17500)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- グローバルテック / SecureGate Standard(月契: ¥20,000 + 超過分×¥100)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000010', '2026-01', 65, 21500),
    ('d0000001-0000-0000-0000-000000000010', '2026-02', 70, 22000),
    ('d0000001-0000-0000-0000-000000000010', '2026-03', 72, 22200)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- みどり銀行 / SecureGate Advanced(年契: ¥60,000 + 超過分×¥80)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000011', '2026-01', 310, 68800),
    ('d0000001-0000-0000-0000-000000000011', '2026-02', 315, 69200),
    ('d0000001-0000-0000-0000-000000000011', '2026-03', 320, 69600)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- みどり銀行 / DataVault Pro(年契: ¥25,000 + 超過分×¥1.5)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000012', '2026-01', 620, 25180),
    ('d0000001-0000-0000-0000-000000000012', '2026-02', 650, 25225),
    ('d0000001-0000-0000-0000-000000000012', '2026-03', 680, 25270)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- さくら物産 / BizFlow Premium(月契: ¥30,000 + 超過分×¥30)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000013', '2026-01', 450, 30000),
    ('d0000001-0000-0000-0000-000000000013', '2026-02', 480, 30000),
    ('d0000001-0000-0000-0000-000000000013', '2026-03', 510, 30300)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- さくら物産 / CloudSync Pro Starter(月契: ¥5,000 固定)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000014', '2026-01', 3, 5000),
    ('d0000001-0000-0000-0000-000000000014', '2026-02', 4, 5000),
    ('d0000001-0000-0000-0000-000000000014', '2026-03', 4, 5000)
ON CONFLICT (contract_id, year_month) DO NOTHING;

-- テクノサービス / InsightDash Team(月契: ¥12,000 固定)
INSERT INTO monthly_usages (contract_id, year_month, usage_quantity, billing_amount) VALUES
    ('d0000001-0000-0000-0000-000000000015', '2026-01', 3, 12000),
    ('d0000001-0000-0000-0000-000000000015', '2026-02', 4, 12000),
    ('d0000001-0000-0000-0000-000000000015', '2026-03', 5, 12000)
ON CONFLICT (contract_id, year_month) DO NOTHING;
