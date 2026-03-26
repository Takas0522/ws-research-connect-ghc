import { apiClient } from './client'
import type { Plan, MetricLimit } from '../types/api'

export type { Plan, MetricLimit }

interface PlanCreateData {
  plan_code: string
  plan_name: string
  monthly_base_fee: number
  alert_threshold_pct: number
  metric_limits: MetricLimit[]
}

interface PlanUpdateData {
  plan_name?: string
  monthly_base_fee?: number
  alert_threshold_pct?: number
  metric_limits?: MetricLimit[]
}

export async function fetchPlans(productId: string): Promise<Plan[]> {
  return apiClient<Plan[]>(`/products/${productId}/plans`)
}

export async function createPlan(
  productId: string,
  data: PlanCreateData,
): Promise<Plan> {
  return apiClient<Plan>(`/products/${productId}/plans`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePlan(
  planId: string,
  data: PlanUpdateData,
): Promise<Plan> {
  return apiClient<Plan>(`/plans/${planId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePlan(planId: string): Promise<void> {
  await apiClient<void>(`/plans/${planId}`, { method: 'DELETE' })
}
