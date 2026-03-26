import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { TrendPoint } from '../../types/api'

interface TrendChartProps {
  data: TrendPoint[]
  title: string
}

interface ChartDataPoint {
  billing_month: string
  actual_value: number | null
  limit_value: number | null
}

export function TrendChart({ data, title }: TrendChartProps) {
  // Group by billing_month and pick the first metric's values for simple display
  const chartData: ChartDataPoint[] = []
  const seen = new Set<string>()

  for (const point of data) {
    if (!seen.has(point.billing_month)) {
      seen.add(point.billing_month)
      chartData.push({
        billing_month: point.billing_month,
        actual_value: point.actual_value,
        limit_value: point.limit_value,
      })
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">データがありません</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="billing_month"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: string | number | (string | number)[]) =>
              value !== null && value !== undefined
                ? new Intl.NumberFormat('ja-JP').format(Number(value))
                : '—'
            }
            labelFormatter={(label: string) => `月: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual_value"
            name="実績値"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="limit_value"
            name="上限値"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
