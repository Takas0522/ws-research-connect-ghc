import { useState, useEffect, useCallback } from 'react'
import { fetchAuditLogs } from '../api/auditLogs'

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

interface AuditLogFilters {
  resource_type?: string
  action?: string
  limit?: number
  skip?: number
}

export function useAuditLogs(filters?: AuditLogFilters) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAuditLogs(filters)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [filters?.resource_type, filters?.action, filters?.limit, filters?.skip])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { logs, loading, error, refetch: fetchData }
}
