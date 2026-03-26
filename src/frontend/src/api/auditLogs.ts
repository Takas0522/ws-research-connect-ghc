import { apiClient } from './client'

interface AuditLog {
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

interface AuditLogParams {
  resource_type?: string
  action?: string
  limit?: number
  skip?: number
}

export async function fetchAuditLogs(params?: AuditLogParams): Promise<AuditLog[]> {
  const query = new URLSearchParams()
  if (params?.resource_type) query.set('resource_type', params.resource_type)
  if (params?.action) query.set('action', params.action)
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.skip) query.set('skip', String(params.skip))
  const qs = query.toString()
  return apiClient<AuditLog[]>(`/audit-logs/${qs ? '?' + qs : ''}`)
}
