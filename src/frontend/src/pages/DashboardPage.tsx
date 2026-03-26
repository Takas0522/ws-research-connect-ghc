import { useState, useCallback } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { fetchTrend } from '../api/dashboard'
import { UsageSummaryCard } from '../components/Dashboard/UsageSummaryCard'
import { AlertList } from '../components/Dashboard/AlertList'
import { TrendChart } from '../components/Dashboard/TrendChart'
import { UseCaseSummary } from '../components/Dashboard/UseCaseSummary'
import { LastUpdated } from '../components/Dashboard/LastUpdated'
import type { TrendPoint } from '../types/api'

interface SelectedCard {
  customerId: string
  productId: string
  customerName: string
  productName: string
}

export function DashboardPage() {
  const { summary, alerts, useCaseSummary, lastUpdated, loading, error, refetch } =
    useDashboard()

  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [trendLoading, setTrendLoading] = useState(false)

  const handleCardClick = useCallback(
    async (customerId: string, productId: string, customerName: string, productName: string) => {
      setSelectedCard({ customerId, productId, customerName, productName })
      setTrendLoading(true)
      try {
        const data = await fetchTrend(customerId, productId)
        setTrendData(data)
      } catch {
        setTrendData([])
      } finally {
        setTrendLoading(false)
      }
    },
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <LastUpdated lastUpdated={lastUpdated} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <AlertList alerts={alerts} />}

      {/* Usage Summary Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          利用量サマリー
        </h2>
        {summary.length === 0 ? (
          <p className="text-sm text-gray-500">データがありません</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.map((s) => (
              <UsageSummaryCard
                key={`${s.customer_id}-${s.product_id}`}
                summary={s}
                onClick={() =>
                  void handleCardClick(
                    s.customer_id,
                    s.product_id,
                    s.customer_name,
                    s.product_name
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Trend Chart */}
      {selectedCard && (
        <div>
          {trendLoading ? (
            <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <span className="ml-2 text-sm text-gray-600">トレンド読み込み中...</span>
            </div>
          ) : (
            <TrendChart
              data={trendData}
              title={`${selectedCard.customerName} — ${selectedCard.productName} 利用量トレンド（直近12ヶ月）`}
            />
          )}
        </div>
      )}

      {/* Use Case Summary */}
      <UseCaseSummary data={useCaseSummary} />
    </div>
  )
}
