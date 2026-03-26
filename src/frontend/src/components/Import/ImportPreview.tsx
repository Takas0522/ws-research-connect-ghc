import type { ImportPreview as ImportPreviewType } from '../../types/api'

interface ImportPreviewProps {
  preview: ImportPreviewType
  onConfirm: () => void
  onCancel: () => void
  isConfirming: boolean
}

export function ImportPreview({ preview, onConfirm, onCancel, isConfirming }: ImportPreviewProps) {
  const hasValidRecords = preview.records.some((r) => r.status === 'ok')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">取込プレビュー</h2>

      {/* サマリー */}
      <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500">対象月</p>
          <p className="text-sm font-medium text-gray-900">{preview.billing_month}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500">ファイル名</p>
          <p className="text-sm font-medium text-gray-900 truncate">{preview.file_name}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500">レコード数</p>
          <p className="text-sm font-medium text-gray-900">{preview.record_count}</p>
        </div>
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500">エラー数</p>
          <p className={`text-sm font-medium ${preview.error_count > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {preview.error_count}
          </p>
        </div>
      </div>

      {/* 置換警告 */}
      {preview.replace_mode && (
        <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-yellow-700">
              同一対象月のデータが既に存在します。確定すると既存データが置換されます。
            </p>
          </div>
        </div>
      )}

      {/* エラー詳細 */}
      {preview.error_count > 0 && preview.error_details.length > 0 && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">エラー詳細</h3>
          <ul className="list-disc list-inside space-y-1">
            {preview.error_details.map((detail, idx) => (
              <li key={idx} className="text-sm text-red-700">{detail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* プレビューテーブル */}
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顧客コード</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">製品コード</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">メトリクス</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">実績値</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">上限値</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">使用率(%)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ステータス</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.records.map((record, idx) => (
              <tr
                key={idx}
                className={record.status === 'error' ? 'bg-red-50' : ''}
                title={record.error_message ?? undefined}
              >
                <td className="px-4 py-2 text-sm text-gray-900">{record.customer_code}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{record.product_code}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{record.metric_code}</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">{record.actual_value.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  {record.limit_value != null ? record.limit_value.toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  {record.usage_rate != null ? `${record.usage_rate}%` : '-'}
                </td>
                <td className="px-4 py-2 text-center">
                  {record.status === 'ok' ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      エラー
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!hasValidRecords || isConfirming}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              確定中...
            </>
          ) : (
            '確定'
          )}
        </button>
      </div>
    </div>
  )
}
