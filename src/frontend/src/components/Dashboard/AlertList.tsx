import type { UsageAlert } from '../../types/api'

interface AlertListProps {
  alerts: UsageAlert[]
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-red-200 bg-white shadow-sm">
      <div className="border-b border-red-200 bg-red-50 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          アラート ({alerts.length}件)
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                顧客
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                製品
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                メトリクス
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                対象月
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                実績 / 上限
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                使用率
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {alerts.map((alert, idx) => {
              const isOver100 = alert.usage_rate >= 100
              const rowClass = isOver100
                ? 'bg-red-50'
                : 'bg-yellow-50'
              return (
                <tr key={`${alert.customer_name}-${alert.product_name}-${alert.metric_code}-${idx}`} className={rowClass}>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                    {alert.customer_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                    {alert.product_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700">
                    {alert.metric_code}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                    {alert.billing_month}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-700">
                    {new Intl.NumberFormat('ja-JP').format(alert.actual_value)} /{' '}
                    {new Intl.NumberFormat('ja-JP').format(alert.limit_value)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-2 text-right text-sm font-semibold ${
                      isOver100 ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    {alert.usage_rate.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
