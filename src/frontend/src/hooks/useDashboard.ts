import { useState, useEffect, useCallback } from 'react'
import type { UsageSummary, UsageAlert, UseCaseSummary } from '../types/api'
import {
  fetchUsageSummary,
  fetchAlerts,
  fetchUseCaseSummary,
  fetchLastUpdated,
} from '../api/dashboard'

interface DashboardData {
  summary: UsageSummary[]
  alerts: UsageAlert[]
  useCaseSummary: UseCaseSummary[]
  lastUpdated: string | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboard(): DashboardData {
  const [summary, setSummary] = useState<UsageSummary[]>([])
  const [alerts, setAlerts] = useState<UsageAlert[]>([])
  const [useCaseSummary, setUseCaseSummary] = useState<UseCaseSummary[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, alertsData, useCaseData, lastUpdatedData] =
        await Promise.all([
          fetchUsageSummary(),
          fetchAlerts(),
          fetchUseCaseSummary(),
          fetchLastUpdated(),
        ])
      setSummary(summaryData)
      setAlerts(alertsData)
      setUseCaseSummary(useCaseData)
      setLastUpdated(lastUpdatedData.last_updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { summary, alerts, useCaseSummary, lastUpdated, loading, error, refetch: fetchData }
}
