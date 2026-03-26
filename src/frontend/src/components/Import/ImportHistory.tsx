import type { UsageImport } from '../../types/api'

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  uploaded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'アップロード済' },
  validated: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '検証済' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: '確定済' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: '失敗' },
}

interface ImportHistoryProps {
  imports: UsageImport[]
  loading: boolean
}

export function ImportHistory({ imports, loading }: ImportHistoryProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">取込履歴</h2>
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" aria-label="読み込み中">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">取込履歴</h2>

      {imports.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">取込履歴がありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象月</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ファイル名</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ステータス</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">レコード数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">エラー数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">アップロード日時</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">確定日時</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {imports.map((item) => {
                const badge = STATUS_BADGES[item.status] ?? STATUS_BADGES['uploaded']
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.billing_month}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-48">{item.file_name}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.record_count}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.error_count}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.confirmed_at
                        ? new Date(item.confirmed_at).toLocaleString('ja-JP')
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
