import { useState, type ReactNode, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { formatYen } from '../lib/format';
import type { ProductDetail } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

export default function ProductDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, refetch } = useFetch<ProductDetail>(`/api/products/${id}`);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddPlan = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/products/${id}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          monthlyFee: Number(fd.get('monthlyFee')),
          unitPrice: fd.get('unitPrice') ? Number(fd.get('unitPrice')) : null,
          freeTierQuantity: fd.get('freeTierQuantity') ? Number(fd.get('freeTierQuantity')) : null,
          freeTierUnit: fd.get('freeTierUnit') || null,
          billingCycleDiscount: fd.get('billingCycleDiscount') ? Number(fd.get('billingCycleDiscount')) : null,
          note: fd.get('note') || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlanModalOpen(false);
      refetch();
    } catch {
      alert('保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          category: fd.get('category'),
          summary: fd.get('summary') || null,
          status: fd.get('status'),
          launchedAt: fd.get('launchedAt') || null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEditModalOpen(false);
      refetch();
    } catch {
      alert('更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!data) return <EmptyState message="製品が見つかりません" />;

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm text-blue-600 hover:underline">← 製品一覧に戻る</Link>

      {/* Product Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{data.category}</p>
            {data.summary && <p className="mt-2 text-sm text-gray-600">{data.summary}</p>}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={data.status} variant="product" />
            <button onClick={() => setEditModalOpen(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">編集</button>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">プラン一覧</h2>
          <button onClick={() => setPlanModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">プラン追加</button>
        </div>
        {data.plans.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">名前</th>
                  <th className="px-4 py-3 text-right">月額基本料</th>
                  <th className="px-4 py-3 text-right">従量単価</th>
                  <th className="px-4 py-3">無料枠</th>
                  <th className="px-4 py-3 text-right">年額割引</th>
                </tr>
              </thead>
              <tbody>
                {data.plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{plan.name}</td>
                    <td className="px-4 py-3 text-right">{formatYen(plan.monthlyFee)}</td>
                    <td className="px-4 py-3 text-right">{plan.unitPrice !== null ? formatYen(plan.unitPrice) : '—'}</td>
                    <td className="px-4 py-3">{plan.freeTierQuantity !== null ? `${plan.freeTierQuantity} ${plan.freeTierUnit ?? ''}` : '—'}</td>
                    <td className="px-4 py-3 text-right">{plan.billingCycleDiscount !== null ? `${(plan.billingCycleDiscount * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="プランがまだ登録されていません" />
        )}
      </div>

      {/* Add Plan Modal */}
      <Modal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} title="プラン追加">
        <form onSubmit={handleAddPlan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">名前 *</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">月額基本料 *</label>
              <input name="monthlyFee" type="number" required min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">従量単価</label>
              <input name="unitPrice" type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">無料枠数量</label>
              <input name="freeTierQuantity" type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">無料枠単位</label>
              <input name="freeTierUnit" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">年額割引率 (0-1)</label>
            <input name="billingCycleDiscount" type="number" step="0.01" min="0" max="1" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">備考</label>
            <textarea name="note" rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPlanModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="製品編集">
        <form onSubmit={handleEditProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">名前 *</label>
            <input name="name" required defaultValue={data.name} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">カテゴリ *</label>
            <input name="category" required defaultValue={data.category} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">概要</label>
            <textarea name="summary" rows={2} defaultValue={data.summary ?? ''} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ステータス *</label>
              <select name="status" required defaultValue={data.status} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="active">アクティブ</option>
                <option value="beta">ベータ</option>
                <option value="discontinued">終了</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">リリース日</label>
              <input name="launchedAt" type="date" defaultValue={data.launchedAt?.split('T')[0] ?? ''} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
