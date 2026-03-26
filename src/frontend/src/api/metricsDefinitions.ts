import { apiClient } from './client'

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

interface MetricsDefinitionCreateData {
  metric_code: string
  metric_name: string
  unit: string
  description?: string
}

interface MetricsDefinitionUpdateData {
  metric_name?: string
  unit?: string
  description?: string
}

export async function fetchMetricsDefinitions(
  productId: string,
): Promise<MetricsDefinition[]> {
  return apiClient<MetricsDefinition[]>(`/products/${productId}/metrics`)
}

export async function createMetricsDefinition(
  productId: string,
  data: MetricsDefinitionCreateData,
): Promise<MetricsDefinition> {
  return apiClient<MetricsDefinition>(`/products/${productId}/metrics`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMetricsDefinition(
  definitionId: string,
  data: MetricsDefinitionUpdateData,
): Promise<MetricsDefinition> {
  return apiClient<MetricsDefinition>(`/metrics-definitions/${definitionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMetricsDefinition(
  definitionId: string,
): Promise<void> {
  await apiClient<void>(`/metrics-definitions/${definitionId}`, {
    method: 'DELETE',
  })
}
