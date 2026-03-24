import { useState, type ReactNode, type FormEvent } from 'react';
import { useFetch } from '../lib/useFetch';
import { formatYen, formatYearMonth } from '../lib/format';
import type { Usage } from '../types/api';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

export default function UsagePage(): ReactNode {
  const { data, loading, error, refetch } = useFetch<Usage[]>('/api/usages');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  const filtered = data?.filter((u) => {
    if (filterCustomer && u.customerName !== filterCustomer) return false;
    if (filterProduct && u.productName !== filterProduct) return false;
    if (filterPeriod && u.yearMonth !== filterPeriod) return false;
    return true;
  }) ?? [];

  const uniqueCustomers = [...new Set(data?.map((u) => u.customerName) ?? [])];
  const uniqueProducts = [...new Set(data?.map((u) => u.productName) ?? [])];
  const uniquePeriods = [...new Set(data?.map((u) => u.yearMonth) ?? [])].sort().reverse();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/usages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: fd.get('contractId'),
          yearMonth: fd.get('yearMonth'),
          usageQuantity: Number(fd.get('usageQuantity')),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModalOpen(false);
      refetch();
    } catch {
      alert('登録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">利用実績</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">実績登録</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全顧客</option>
          {uniqueCustomers.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全製品</option>
          {uniqueProducts.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全期間</option>
          {uniquePeriods.map((p) => <option key={p} value={p}>{formatYearMonth(p)}</option>)}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">製品</th>
                <th className="px-4 py-3">プラン</th>
                <th className="px-4 py-3">年月</th>
                <th className="px-4 py-3 text-right">利用量</th>
                <th className="px-4 py-3 text-right">請求額</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{u.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{u.planName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatYearMonth(u.yearMonth)}</td>
                  <td className="px-4 py-3 text-right">{u.usageQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{formatYen(u.billingAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="該当する利用実績がありません" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="実績登録">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">契約ID *</label>
            <input name="contractId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="契約IDを入力" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">年月 *</label>
              <input name="yearMonth" type="month" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">利用量 *</label>
              <input name="usageQuantity" type="number" required min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
