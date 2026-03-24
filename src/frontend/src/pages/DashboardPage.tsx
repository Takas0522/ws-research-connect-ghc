import { type ReactNode, useMemo } from 'react';
import { useFetch } from '../lib/useFetch';
import { formatYen, formatYearMonth } from '../lib/format';
import type { RevenueData, CustomerSummary, TrialKPI } from '../types/api';
import Card from '../components/Card';
import LineChartComponent from '../components/charts/LineChartComponent';
import PieChartComponent from '../components/charts/PieChartComponent';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

function remainingDaysColor(days: number): string {
  if (days <= 0) return 'text-gray-400';
  if (days <= 2) return 'text-red-600 font-semibold';
  if (days <= 6) return 'text-yellow-600';
  return 'text-green-600';
}

export default function DashboardPage(): ReactNode {
  const revenue = useFetch<RevenueData>('/api/dashboard/revenue');
  const customers = useFetch<CustomerSummary[]>('/api/dashboard/customers');
  const trials = useFetch<TrialKPI>('/api/dashboard/trials');

  const loading = revenue.loading || customers.loading || trials.loading;
  const error = revenue.error || customers.error || trials.error;
  const revenueMonths = revenue.data?.months ?? [];

  const latestMonth = revenueMonths.at(-1);
  const totalRevenue = latestMonth?.totalRevenue ?? 0;

  const lineData = useMemo(() => {
    if (revenueMonths.length === 0) return [];
    const productNames = new Set<string>();
    revenueMonths.forEach((m) => m.byProduct.forEach((p) => productNames.add(p.productName)));
    return revenueMonths.map((m) => {
      const row: Record<string, unknown> = { month: formatYearMonth(m.yearMonth) };
      m.byProduct.forEach((p) => {
        row[p.productName] = p.revenue;
      });
      return row;
    });
  }, [revenueMonths]);

  const lineSeries = useMemo(() => {
    if (revenueMonths.length === 0) return [];
    const names = new Set<string>();
    revenueMonths.forEach((m) => m.byProduct.forEach((p) => names.add(p.productName)));
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#db2777', '#0891b2'];
    return Array.from(names).map((name, i) => ({
      dataKey: name,
      name,
      color: colors[i % colors.length],
    }));
  }, [revenueMonths]);

  const pieData = useMemo(() => {
    if (!latestMonth) return [];
    return latestMonth.byProduct.map((p) => ({ name: p.productName, value: p.revenue }));
  }, [latestMonth]);

  const top5Customers = useMemo(() => {
    if (!customers.data) return [];
    return [...customers.data].sort((a, b) => b.latestMonthlyTotal - a.latestMonthlyTotal).slice(0, 5);
  }, [customers.data]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => { revenue.refetch(); customers.refetch(); trials.refetch(); }} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="月次売上合計" value={formatYen(totalRevenue)} />
        <Card
          title="アクティブ契約数"
          value={customers.data?.reduce((s, c) => s + c.contractCount, 0) ?? 0}
        />
        <Card title="進行中トライアル" value={trials.data?.activeTrials ?? 0} />
        <Card
          title="トライアル転換率"
          value={`${((trials.data?.conversionRate ?? 0) * 100).toFixed(1)}%`}
          subtitle={`今月転換: ${trials.data?.convertedThisMonth ?? 0}件`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">月次売上推移</h2>
          {lineData.length > 0 ? (
            <LineChartComponent data={lineData} xKey="month" series={lineSeries} />
          ) : (
            <EmptyState message="売上データがありません" />
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">製品別売上比率</h2>
          {pieData.length > 0 ? (
            <PieChartComponent data={pieData} />
          ) : (
            <EmptyState message="売上データがありません" />
          )}
        </div>
      </div>

      {/* Bottom: Customer ranking + Trial alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Ranking */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">顧客ランキング (Top 5)</h2>
          {top5Customers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">#</th>
                  <th className="pb-2">顧客名</th>
                  <th className="pb-2 text-right">月額合計</th>
                  <th className="pb-2 text-center">トレンド</th>
                </tr>
              </thead>
              <tbody>
                {top5Customers.map((c, i) => (
                  <tr key={c.customerId} className="border-b last:border-0">
                    <td className="py-2 font-medium text-gray-500">{i + 1}</td>
                    <td className="py-2">{c.customerName}</td>
                    <td className="py-2 text-right">{formatYen(c.latestMonthlyTotal)}</td>
                    <td className="py-2 text-center">
                      {c.trend === 'increasing' && <span className="text-green-600">↑</span>}
                      {c.trend === 'decreasing' && <span className="text-red-600">↓</span>}
                      {c.trend === 'stable' && <span className="text-gray-400">→</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="顧客データがありません" />
          )}
        </div>

        {/* Trial alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">期限間近トライアル</h2>
          {trials.data && trials.data.expiringWithin7Days.length > 0 ? (
            <ul className="space-y-2">
              {trials.data.expiringWithin7Days.map((t, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.customerName}</p>
                    <p className="text-xs text-gray-500">{t.productName}</p>
                  </div>
                  <span className={`text-sm font-medium ${remainingDaysColor(t.remainingDays)}`}>
                    残り {t.remainingDays} 日
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="期限間近のトライアルはありません" />
          )}
        </div>
      </div>
    </div>
  );
}
