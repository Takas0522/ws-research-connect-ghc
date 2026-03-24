import type { ReactNode } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarSeriesConfig {
  dataKey: string;
  name: string;
  color: string;
}

interface BarChartComponentProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: BarSeriesConfig[];
  height?: number;
}

export default function BarChartComponent({
  data,
  xKey,
  series,
  height = 300,
}: BarChartComponentProps): ReactNode {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {series.map((s) => (
          <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
