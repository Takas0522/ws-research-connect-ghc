import { useState, useEffect, useCallback } from 'react'
import { fetchPlans, type Plan } from '../api/plans'

export function usePlans(productId: string | null) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!productId) {
      setPlans([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPlans(productId)
      setPlans(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { plans, loading, error, refetch: fetchData }
}
