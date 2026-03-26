import { useState, useEffect, useCallback } from 'react'
import {
  fetchMetricsDefinitions,
  type MetricsDefinition,
} from '../api/metricsDefinitions'

export function useMetricsDefinitions(productId: string | null) {
  const [definitions, setDefinitions] = useState<MetricsDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!productId) {
      setDefinitions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMetricsDefinitions(productId)
      setDefinitions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { definitions, loading, error, refetch: fetchData }
}
