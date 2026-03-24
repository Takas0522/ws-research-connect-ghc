import { useState, type ReactNode, type FormEvent } from 'react';
import { useFetch } from '../lib/useFetch';
import { formatDate } from '../lib/format';
import type { Trial } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

function remainingDaysClass(days: number): string {
  if (days <= 0) return 'text-gray-400';
  if (days <= 2) return 'text-red-600 font-semibold';
  if (days <= 6) return 'text-yellow-600';
  return 'text-green-600';
}

const restrictionLabels: Record<string, string> = {
  full: 'フル',
  feature_limited: '機能制限',
  capacity_limited: '容量制限',
};

export default function TrialsPage(): ReactNode {
  const { data, loading, error, refetch } = useFetch<Trial[]>('/api/trials');
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const filtered = data?.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterCustomer && t.customerName !== filterCustomer) return false;
    return true;
  }) ?? [];

  const uniqueCustomers = [...new Set(data?.map((t) => t.customerName) ?? [])];

  const handleStartTrial = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: fd.get('customerId'),
          productId: fd.get('productId'),
          startDate: fd.get('startDate'),
          endDate: fd.get('endDate'),
          restrictionLevel: fd.get('restrictionLevel'),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStartModalOpen(false);
      refetch();
    } catch {
      alert('トライアル開始に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/trials/${selectedTrialId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: fd.get('planId'),
          contractType: fd.get('contractType'),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConvertModalOpen(false);
      setSelectedTrialId(null);
      refetch();
    } catch {
      alert('転換に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (trialId: string) => {
    if (!confirm('このトライアルをキャンセルしますか？')) return;
    try {
      const res = await fetch(`/api/trials/${trialId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      refetch();
    } catch {
      alert('キャンセルに失敗しました');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">トライアル</h1>
        <button onClick={() => setStartModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">トライアル開始</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全顧客</option>
          {uniqueCustomers.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">全ステータス</option>
          <option value="active">アクティブ</option>
          <option value="converted">転換済</option>
          <option value="expired">期限切れ</option>
          <option value="cancelled">キャンセル</option>
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">顧客</th>
                <th className="px-4 py-3">製品</th>
                <th className="px-4 py-3">開始日</th>
                <th className="px-4 py-3">終了日</th>
                <th className="px-4 py-3 text-center">残り日数</th>
                <th className="px-4 py-3">制限</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{t.productName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.startDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.endDate)}</td>
                  <td className={`px-4 py-3 text-center ${remainingDaysClass(t.remainingDays)}`}>
                    {t.remainingDays > 0 ? `${t.remainingDays}日` : '期限切れ'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{restrictionLabels[t.restrictionLevel] ?? t.restrictionLevel}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} variant="trial" /></td>
                  <td className="px-4 py-3">
                    {t.status === 'active' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setSelectedTrialId(t.id); setConvertModalOpen(true); }}
                          className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                        >
                          転換
                        </button>
                        <button
                          onClick={() => handleCancel(t.id)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          キャンセル
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="該当するトライアルがありません" />
      )}

      {/* Start Trial Modal */}
      <Modal isOpen={startModalOpen} onClose={() => setStartModalOpen(false)} title="トライアル開始">
        <form onSubmit={handleStartTrial} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">顧客ID *</label>
            <input name="customerId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">製品ID *</label>
            <input name="productId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">開始日 *</label>
              <input name="startDate" type="date" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">終了日 *</label>
              <input name="endDate" type="date" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">制限レベル *</label>
            <select name="restrictionLevel" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="full">フル</option>
              <option value="feature_limited">機能制限</option>
              <option value="capacity_limited">容量制限</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setStartModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '開始中...' : '開始'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Trial Modal */}
      <Modal isOpen={convertModalOpen} onClose={() => { setConvertModalOpen(false); setSelectedTrialId(null); }} title="本契約に転換">
        <form onSubmit={handleConvert} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">プランID *</label>
            <input name="planId" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">契約種別 *</label>
            <select name="contractType" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="monthly">月額</option>
              <option value="yearly">年額</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setConvertModalOpen(false); setSelectedTrialId(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? '処理中...' : '転換する'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
