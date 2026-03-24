import { useState, type ReactNode, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { formatDate } from '../lib/format';
import type { Contract, Product, Customer } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

export default function ContractsPage(): ReactNode {
  const { data, loading, error, refetch } = useFetch<Contract[]>('/api/contracts');
  const products = useFetch<Product[]>('/api/products');
  const customers = useFetch<Customer[]>('/api/customers');
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  const filtered = data?.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterCustomer && c.customerName !== filterCustomer) return false;
    if (filterProduct && c.productName !== filterProduct) return false;
    return true;
  }) ?? [];

  const uniqueCustomers = [...new Set(data?.map((c) => c.customerName) ?? [])];
  const uniqueProducts = [...new Set(data?.map((c) => c.productName) ?? [])];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: fd.get('customerId'),
          planId: fd.get('planId'),
          contractType: fd.get('contractType'),
          startDate: fd.get('startDate'),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModalOpen(false);
      refetch();
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">契約一覧</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">新規契約</button>
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
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全ステータス</option>
          <option value="active">アクティブ</option>
          <option value="cancelled">解約済</option>
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
                <th className="px-4 py-3">契約種別</th>
                <th className="px-4 py-3">開始日</th>
                <th className="px-4 py-3">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/contracts/${c.id}`)} className="cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{c.planName}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.contractType} /></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(c.startDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} variant="contract" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="該当する契約がありません" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新規契約">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">顧客 *</label>
            <select name="customerId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">選択してください</option>
              {customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">製品 / プラン *</label>
            <select name="planId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">選択してください</option>
              {products.data?.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  {/* Plans are fetched per product on the backend; here we use product IDs as placeholder */}
                  <option value={p.id}>{p.name} (デフォルトプラン)</option>
                </optgroup>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">契約種別 *</label>
              <select name="contractType" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="monthly">月額</option>
                <option value="yearly">年額</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">開始日 *</label>
              <input name="startDate" type="date" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
