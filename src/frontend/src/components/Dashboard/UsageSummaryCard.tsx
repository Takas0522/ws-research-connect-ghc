import type { UsageSummary } from '../../types/api'

const USAGE_RATE_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
} as const

function getUsageColor(rate: number): keyof typeof USAGE_RATE_COLORS {
  if (rate >= 90) return 'red'
  if (rate >= 80) return 'yellow'
  return 'green'
}

interface UsageSummaryCardProps {
  summary: UsageSummary
  onClick: () => void
}

export function UsageSummaryCard({ summary, onClick }: UsageSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {summary.customer_name}
          </h3>
          <p className="text-xs text-gray-500">
            {summary.product_name}
            {summary.plan_name && ` / ${summary.plan_name}`}
          </p>
        </div>
        {summary.has_alert && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            アラート
          </span>
        )}
      </div>

      <p className="mb-2 text-xs text-gray-400">{summary.billing_month}</p>

      <div className="space-y-2">
        {summary.metrics.map((metric) => {
          const color = getUsageColor(metric.usage_rate)
          const barWidth = Math.min(metric.usage_rate, 100)
          return (
            <div key={metric.metric_code}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">
                  {metric.metric_code}
                </span>
                <span className="text-gray-500">
                  {new Intl.NumberFormat('ja-JP').format(metric.actual_value)} /{' '}
                  {new Intl.NumberFormat('ja-JP').format(metric.limit_value)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${USAGE_RATE_COLORS[color]}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className={`min-w-[3rem] text-right text-xs font-semibold ${
                    color === 'red'
                      ? 'text-red-600'
                      : color === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {metric.usage_rate.toFixed(1)}%
                </span>
              </div>
              {metric.overage_fee > 0 && (
                <p className="mt-0.5 text-xs text-red-500">
                  超過料金: ¥{new Intl.NumberFormat('ja-JP').format(metric.overage_fee)}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </button>
  )
}
