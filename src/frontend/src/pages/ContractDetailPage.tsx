import { type ReactNode, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { formatDate, formatYen, formatYearMonth } from '../lib/format';
import type { Contract, ContractHistory, Usage } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

const changeTypeLabels: Record<string, string> = {
  plan_change: 'プラン変更',
  cancellation: '解約',
  type_change: '種別変更',
};

export default function ContractDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const contract = useFetch<Contract>(`/api/contracts/${id}`);
  const history = useFetch<ContractHistory[]>(`/api/contracts/${id}/history`);
  const usages = useFetch<Usage[]>(`/api/contracts/${id}/usages`);

  const [planChangeOpen, setPlanChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loading = contract.loading || history.loading || usages.loading;
  const error = contract.error || history.error || usages.error;

  const handlePlanChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/contracts/${id}/plan-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: fd.get('newPlanId'), reason: fd.get('reason') || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlanChangeOpen(false);
      contract.refetch();
      history.refetch();
    } catch {
      alert('プラン変更に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/contracts/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: fd.get('reason') || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCancelOpen(false);
      contract.refetch();
      history.refetch();
    } catch {
      alert('解約に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => { contract.refetch(); history.refetch(); usages.refetch(); }} />;
  if (!contract.data) return <EmptyState message="契約が見つかりません" />;

  const c = contract.data;

  return (
    <div className="space-y-6">
      <Link to="/contracts" className="text-sm text-blue-600 hover:underline">← 契約一覧に戻る</Link>

      {/* Contract Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{c.customerName} — {c.productName}</h1>
            <p className="text-sm text-gray-600">プラン: {c.planName}</p>
            <div className="flex items-center gap-3 pt-1">
              <StatusBadge status={c.contractType} />
              <StatusBadge status={c.status} variant="contract" />
            </div>
            <p className="text-sm text-gray-500">開始日: {formatDate(c.startDate)}{c.endDate ? ` ～ ${formatDate(c.endDate)}` : ''}</p>
          </div>
          {c.status === 'active' && (
            <div className="flex gap-2">
              <button onClick={() => setPlanChangeOpen(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">プラン変更</button>
              <button onClick={() => setCancelOpen(true)} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">解約</button>
            </div>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">変更履歴</h2>
        {history.data && history.data.length > 0 ? (
          <div className="space-y-2">
            {history.data.map((h) => (
              <div key={h.id} className="flex gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3">
                <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{changeTypeLabels[h.changeType] ?? h.changeType}</span>
                    <span className="text-xs text-gray-400">{formatDate(h.changedAt)}</span>
                  </div>
                  {h.oldPlanName && h.newPlanName && (
                    <p className="text-xs text-gray-500">{h.oldPlanName} → {h.newPlanName}</p>
                  )}
                  {h.reason && <p className="text-xs text-gray-500">理由: {h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="変更履歴がありません" />
        )}
      </div>

      {/* Usages */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">利用実績</h2>
        {usages.data && usages.data.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">年月</th>
                  <th className="px-4 py-3 text-right">利用量</th>
                  <th className="px-4 py-3 text-right">請求額</th>
                </tr>
              </thead>
              <tbody>
                {usages.data.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{formatYearMonth(u.yearMonth)}</td>
                    <td className="px-4 py-3 text-right">{u.usageQuantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{formatYen(u.billingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="利用実績がありません" />
        )}
      </div>

      {/* Plan Change Modal */}
      <Modal isOpen={planChangeOpen} onClose={() => setPlanChangeOpen(false)} title="プラン変更">
        <form onSubmit={handlePlanChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">新しいプラン *</label>
            <input name="newPlanId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="プランIDを入力" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">変更理由</label>
            <textarea name="reason" rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setPlanChangeOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '処理中...' : '変更'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="契約解約">
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-sm text-gray-600">この契約を解約しますか？</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">解約理由</label>
            <textarea name="reason" rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCancelOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">戻る</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {submitting ? '処理中...' : '解約する'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
