import { useState } from 'react'
import { useMetricsDefinitions } from '../../hooks/useMetricsDefinitions'
import {
  deleteMetricsDefinition,
  type MetricsDefinition,
} from '../../api/metricsDefinitions'
import { MetricsForm } from './MetricsForm'

interface MetricsTabProps {
  productId: string | null
}

export function MetricsTab({ productId }: MetricsTabProps) {
  const { definitions, loading, error, refetch } = useMetricsDefinitions(productId)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDefinition, setEditingDefinition] = useState<
    MetricsDefinition | undefined
  >(undefined)

  const handleDelete = async (id: string) => {
    try {
      await deleteMetricsDefinition(id)
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const handleEdit = (definition: MetricsDefinition) => {
    setEditingDefinition(definition)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingDefinition(undefined)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingDefinition(undefined)
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingDefinition(undefined)
    await refetch()
  }

  if (!productId) {
    return (
      <div className="rounded-md bg-gray-50 py-12 text-center">
        <p className="text-gray-500">
          製品を選択してメトリクス定義を表示してください
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">メトリクス定義</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規登録
        </button>
      </div>

      {definitions.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-12 text-center">
          <p className="text-gray-500">
            メトリクス定義が登録されていません
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メトリクスコード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  メトリクス名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  単位
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  説明
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {definitions.map((def) => (
                <tr key={def.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {def.metric_code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {def.metric_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {def.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {def.description || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleEdit(def)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(def.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productId && (
        <MetricsForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={() => void handleFormSuccess()}
          productId={productId}
          definition={editingDefinition}
        />
      )}
    </div>
  )
}
