import { useState, useEffect, useCallback } from 'react'
import type { Contract, ContractPlanHistory, PrimaryUseCase, ContractStatus } from '../../types/api'
import { fetchContractHistory } from '../../api/contracts'
import { RenewalAlert } from './RenewalAlert'

const USE_CASE_LABELS: Record<PrimaryUseCase, string> = {
  sales_ops: '営業支援',
  customer_support: 'カスタマーサポート',
  analytics: '分析',
  integration: 'システム連携',
  other: 'その他',
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  active: '有効',
  renewing: '更新中',
  suspended: '停止中',
  terminated: '解約済',
}

const STATUS_COLORS: Record<ContractStatus, string> = {
  active: 'bg-green-100 text-green-800',
  renewing: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-orange-100 text-orange-800',
  terminated: 'bg-red-100 text-red-800',
}

interface ContractDetailProps {
  contract: Contract
  onBack: () => void
  onEdit: (contract: Contract) => void
}

export function ContractDetail({ contract, onBack, onEdit }: ContractDetailProps) {
  const [history, setHistory] = useState<ContractPlanHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const data = await fetchContractHistory(contract.id)
      setHistory(data)
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : '履歴の取得に失敗しました')
    } finally {
      setHistoryLoading(false)
    }
  }, [contract.id])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          ← 契約一覧に戻る
        </button>
        <button
          type="button"
          onClick={() => onEdit(contract)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          編集
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">契約詳細</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">顧客名</dt>
            <dd className="mt-1 text-sm text-gray-900">{contract.customer_name ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">製品</dt>
            <dd className="mt-1 text-sm text-gray-900">{contract.product_name ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">プラン</dt>
            <dd className="mt-1 text-sm text-gray-900">{contract.plan_name ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ライセンス数</dt>
            <dd className="mt-1 text-sm text-gray-900">{contract.license_count}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ステータス</dt>
            <dd className="mt-1">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[contract.status]}`}>
                {STATUS_LABELS[contract.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">主な利用目的</dt>
            <dd className="mt-1 text-sm text-gray-900">{USE_CASE_LABELS[contract.primary_use_case]}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">契約開始日</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(contract.contract_start_date).toLocaleDateString('ja-JP')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">契約終了日</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {contract.contract_end_date
                ? new Date(contract.contract_end_date).toLocaleDateString('ja-JP')
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">契約更新日</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
              {new Date(contract.contract_renewal_date).toLocaleDateString('ja-JP')}
              <RenewalAlert renewalDate={contract.contract_renewal_date} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">プラン変更履歴</h3>

        {historyLoading && (
          <div className="py-4 text-center text-sm text-gray-500">読み込み中...</div>
        )}

        {historyError && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{historyError}</p>
            <button
              type="button"
              onClick={() => void loadHistory()}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              再試行
            </button>
          </div>
        )}

        {!historyLoading && !historyError && history.length === 0 && (
          <div className="py-4 text-center text-sm text-gray-500">
            プラン変更履歴はありません
          </div>
        )}

        {!historyLoading && !historyError && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    適用開始日
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    適用終了日
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    月額基本料
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    ライセンス数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    変更理由
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {new Date(h.effective_from).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {h.effective_to
                        ? new Date(h.effective_to).toLocaleDateString('ja-JP')
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      ¥{h.monthly_base_fee_snapshot.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                      {h.license_count_snapshot}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {h.change_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
