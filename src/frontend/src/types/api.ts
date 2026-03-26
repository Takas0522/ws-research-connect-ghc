export interface User {
  id: string
  email: string
  display_name: string
  role: 'sales' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Product {
  id: string
  product_code: string
  product_name: string
  category: string
  vendor: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MetricsDefinition {
  id: string
  product_id: string
  metric_code: string
  metric_name: string
  unit: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MetricLimit {
  metric_code: string
  limit_value: number
  overage_unit_price: number
}

export interface Plan {
  id: string
  product_id: string
  plan_code: string
  plan_name: string
  monthly_base_fee: number
  alert_threshold_pct: number
  metric_limits: MetricLimit[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  customer_code: string
  customer_name: string
  assigned_sales_user_id: string | null
  contact_person: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_user_id: string
  actor_email: string | null
  resource_type: string
  resource_id: string
  action: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}

export type ContractStatus = 'active' | 'renewing' | 'suspended' | 'terminated'
export type PrimaryUseCase = 'sales_ops' | 'customer_support' | 'analytics' | 'integration' | 'other'

export interface Contract {
  id: string
  customer_id: string
  product_id: string
  current_plan_id: string
  contract_start_date: string
  contract_end_date: string | null
  contract_renewal_date: string
  license_count: number
  status: ContractStatus
  primary_use_case: PrimaryUseCase
  customer_name?: string
  product_name?: string
  plan_name?: string
  created_at: string
  updated_at: string
}

export interface ContractPlanHistory {
  id: string
  contract_id: string
  plan_id: string
  effective_from: string
  effective_to: string | null
  monthly_base_fee_snapshot: number
  metric_limits_snapshot: MetricLimit[]
  license_count_snapshot: number
  change_reason: string
  changed_by_user_id: string
  created_at: string
}

export interface UsageImport {
  id: string
  billing_month: string
  source_type: string
  file_name: string
  replace_mode: boolean
  status: 'uploaded' | 'validated' | 'confirmed' | 'failed'
  uploaded_by_user_id: string
  record_count: number
  error_count: number
  error_details: string[]
  created_at: string
  confirmed_at: string | null
}

export interface ImportPreviewRecord {
  customer_code: string
  product_code: string
  metric_code: string
  actual_value: number
  limit_value: number | null
  usage_rate: number | null
  overage_count: number | null
  overage_fee: number | null
  status: 'ok' | 'error'
  error_message: string | null
}

export interface ImportPreview {
  import_id: string
  billing_month: string
  file_name: string
  record_count: number
  error_count: number
  error_details: string[]
  records: ImportPreviewRecord[]
  replace_mode: boolean
  status: string
}

export interface UsageSummaryMetric {
  metric_code: string
  actual_value: number
  limit_value: number
  usage_rate: number
  overage_fee: number
}

export interface UsageSummary {
  customer_id: string
  customer_name: string
  product_id: string
  product_name: string
  plan_name: string
  billing_month: string
  metrics: UsageSummaryMetric[]
  alert_threshold_pct: number
  has_alert: boolean
}

export interface UsageAlert {
  customer_name: string
  product_name: string
  metric_code: string
  billing_month: string
  usage_rate: number
  limit_value: number
  actual_value: number
  alert_threshold_pct: number
}

export interface TrendPoint {
  billing_month: string
  metric_code: string
  actual_value: number | null
  limit_value: number | null
  usage_rate: number | null
}

export interface UseCaseSummary {
  use_case: string
  count: number
  label: string
}
