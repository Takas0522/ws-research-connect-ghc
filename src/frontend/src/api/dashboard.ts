import { apiClient } from './client'
import type {
  UsageSummary,
  UsageAlert,
  TrendPoint,
  UseCaseSummary,
} from '../types/api'

export function fetchUsageSummary(): Promise<UsageSummary[]> {
  return apiClient<UsageSummary[]>('/dashboard/summary')
}

export function fetchAlerts(): Promise<UsageAlert[]> {
  return apiClient<UsageAlert[]>('/dashboard/alerts')
}

export function fetchTrend(
  customerId: string,
  productId: string,
  metricCode?: string
): Promise<TrendPoint[]> {
  const params = new URLSearchParams({
    customer_id: customerId,
    product_id: productId,
  })
  if (metricCode) {
    params.set('metric_code', metricCode)
  }
  return apiClient<TrendPoint[]>(`/dashboard/trend?${params.toString()}`)
}

export function fetchUseCaseSummary(): Promise<UseCaseSummary[]> {
  return apiClient<UseCaseSummary[]>('/dashboard/use-case-summary')
}

export function fetchLastUpdated(): Promise<{ last_updated: string | null }> {
  return apiClient<{ last_updated: string | null }>('/dashboard/last-updated')
}
