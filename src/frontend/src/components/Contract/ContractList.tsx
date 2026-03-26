import { useState, useMemo } from 'react'
import type { Contract, ContractStatus } from '../../types/api'
import { RenewalAlert } from './RenewalAlert'

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

interface ContractListProps {
  contracts: Contract[]
  onSelect: (contract: Contract) => void
  onEdit: (contract: Contract) => void
  onCreate: () => void
}

export function ContractList({ contracts, onSelect, onEdit, onCreate }: ContractListProps) {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('')

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch =
        !searchText ||
        (c.customer_name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
        (c.product_name ?? '').toLowerCase().includes(searchText.toLowerCase())
      const matchesStatus = !statusFilter || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [contracts, searchText, statusFilter])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="顧客名・製品名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ContractStatus | '')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全ステータス</option>
            <option value="active">有効</option>
            <option value="renewing">更新中</option>
            <option value="suspended">停止中</option>
            <option value="terminated">解約済</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規契約
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-12 text-center">
          <p className="text-gray-500">契約が見つかりません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  顧客名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  製品
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  プラン
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  ライセンス数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  更新日
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((contract) => (
                <tr
                  key={contract.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSelect(contract)}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {contract.customer_name ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {contract.product_name ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {contract.plan_name ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">
                    {contract.license_count}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[contract.status]}`}
                    >
                      {STATUS_LABELS[contract.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {new Date(contract.contract_renewal_date).toLocaleDateString('ja-JP')}
                      <RenewalAlert renewalDate={contract.contract_renewal_date} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(contract)
                      }}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
