import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import type { UseCaseSummary as UseCaseSummaryType } from '../../types/api'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280']

interface UseCaseSummaryProps {
  data: UseCaseSummaryType[]
}

export function UseCaseSummary({ data }: UseCaseSummaryProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          利用目的別
        </h3>
        <p className="text-sm text-gray-500">データがありません</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.label,
    value: d.count,
  }))

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">利用目的別</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, value }: { name: string; value: number }) =>
              `${name}: ${value}`
            }
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}件`, '契約数']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
