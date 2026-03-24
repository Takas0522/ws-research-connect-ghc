import { useMemo, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { formatYen, formatDate, formatYearMonth } from '../lib/format';
import type { CustomerDetail } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import BarChartComponent from '../components/charts/BarChartComponent';
import LineChartComponent from '../components/charts/LineChartComponent';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

export default function CustomerDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useFetch<CustomerDetail>(`/api/customers/${id}`);

  const usageByProduct = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const c of data.contracts) {
      if (c.latestUsage) {
        map.set(c.productName, (map.get(c.productName) ?? 0) + c.latestUsage.billingAmount);
      }
    }
    return Array.from(map.entries()).map(([name, amount]) => ({ product: name, 金額: amount }));
  }, [data]);

  const billingTrend = useMemo(() => {
    if (!data) return [];
    const monthMap = new Map<string, number>();
    for (const c of data.contracts) {
      if (c.latestUsage) {
        const ym = c.latestUsage.yearMonth;
        monthMap.set(ym, (monthMap.get(ym) ?? 0) + c.latestUsage.billingAmount);
      }
    }
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, amount]) => ({ month: formatYearMonth(ym), 請求額: amount }));
  }, [data]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!data) return <EmptyState message="顧客が見つかりません" />;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="text-sm text-blue-600 hover:underline">← 顧客一覧に戻る</Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
        <p className="mt-1 text-sm text-gray-500">コード: {data.code}</p>
        {data.contact && <p className="mt-1 text-sm text-gray-600">連絡先: {data.contact}</p>}
        {data.note && <p className="mt-2 text-sm text-gray-600">{data.note}</p>}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">製品別利用金額</h2>
          {usageByProduct.length > 0 ? (
            <BarChartComponent
              data={usageByProduct}
              xKey="product"
              series={[{ dataKey: '金額', name: '金額', color: '#2563eb' }]}
            />
          ) : (
            <EmptyState message="利用データがありません" />
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-700">請求額推移</h2>
          {billingTrend.length > 0 ? (
            <LineChartComponent
              data={billingTrend}
              xKey="month"
              series={[{ dataKey: '請求額', name: '請求額', color: '#16a34a' }]}
            />
          ) : (
            <EmptyState message="請求データがありません" />
          )}
        </div>
      </div>

      {/* Contracts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">契約一覧</h2>
        {data.contracts.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">製品</th>
                  <th className="px-4 py-3">プラン</th>
                  <th className="px-4 py-3">契約種別</th>
                  <th className="px-4 py-3">開始日</th>
                  <th className="px-4 py-3">ステータス</th>
                  <th className="px-4 py-3 text-right">直近請求額</th>
                </tr>
              </thead>
              <tbody>
                {data.contracts.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.productName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.planName}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.contractType} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} variant="contract" /></td>
                    <td className="px-4 py-3 text-right">
                      {c.latestUsage ? formatYen(c.latestUsage.billingAmount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="契約がありません" />
        )}
      </div>
    </div>
  );
}
