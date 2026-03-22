import { useState, type ReactNode, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../lib/useFetch';
import { formatYen } from '../lib/format';
import type { Customer } from '../types/api';
import Modal from '../components/Modal';
import { Spinner, ErrorMessage, EmptyState } from '../components/Feedback';

export default function CustomersPage(): ReactNode {
  const { data, loading, error, refetch } = useFetch<Customer[]>('/api/customers');
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fd.get('code'),
          name: fd.get('name'),
          contact: fd.get('contact') || null,
          note: fd.get('note') || null,
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
        <h1 className="text-2xl font-bold text-gray-900">顧客一覧</h1>
        <button onClick={() => setModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">顧客追加</button>
      </div>

      {data && data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">コード</th>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3 text-right">契約数</th>
                <th className="px-4 py-3 text-right">月額合計</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="cursor-pointer border-t border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-600">{c.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-right">{c.activeContractCount}</td>
                  <td className="px-4 py-3 text-right">{formatYen(c.monthlyTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="顧客がまだ登録されていません" />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="顧客追加">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">顧客コード *</label>
            <input name="code" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">名前 *</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">連絡先</label>
            <input name="contact" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">備考</label>
            <textarea name="note" rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
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
