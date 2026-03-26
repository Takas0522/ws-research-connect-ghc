import { useState, useMemo } from 'react'
import { useAuditLogs } from '../../hooks/useAuditLogs'

const ACTION_LABELS: Record<string, string> = {
  create: '作成',
  update: '更新',
  deactivate: '無効化',
  delete: '削除',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function AuditLogTab() {
  const [resourceType, setResourceType] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filters = useMemo(
    () => ({
      resource_type: resourceType || undefined,
      action: action || undefined,
    }),
    [resourceType, action]
  )

  const { logs, loading, error, refetch } = useAuditLogs(filters)

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
        <p>{error}</p>
        <button
          onClick={() => void refetch()}
          className="mt-2 text-red-800 underline hover:text-red-900"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">監査ログ</h2>
      </div>

      <div className="mb-4 flex gap-4">
        <div>
          <label htmlFor="filter-resource-type" className="block text-xs font-medium text-gray-600">
            対象タイプ
          </label>
          <select
            id="filter-resource-type"
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="user">ユーザー</option>
            <option value="product">製品</option>
            <option value="customer">顧客</option>
            <option value="contract">契約</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-action" className="block text-xs font-medium text-gray-600">
            操作
          </label>
          <select
            id="filter-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="create">作成</option>
            <option value="update">更新</option>
            <option value="deactivate">無効化</option>
            <option value="delete">削除</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                日時
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                実行者
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                対象タイプ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                対象ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                詳細
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  監査ログがありません
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {log.actor_email ?? log.actor_user_id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {log.resource_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-500">
                      {log.resource_id.slice(0, 8)}…
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {(log.before || log.after) && (
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          {expandedId === log.id ? '閉じる' : '変更内容'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === log.id && (log.before || log.after) && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={6} className="bg-gray-50 px-4 py-3">
                        <div className="flex gap-6 text-xs">
                          {log.before && (
                            <div>
                              <span className="font-semibold text-gray-600">変更前:</span>
                              <pre className="mt-1 rounded bg-white p-2 text-gray-700">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && (
                            <div>
                              <span className="font-semibold text-gray-600">変更後:</span>
                              <pre className="mt-1 rounded bg-white p-2 text-gray-700">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
