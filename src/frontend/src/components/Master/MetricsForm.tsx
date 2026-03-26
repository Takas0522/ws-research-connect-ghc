import { useState, useEffect } from 'react'
import {
  createMetricsDefinition,
  updateMetricsDefinition,
  type MetricsDefinition,
} from '../../api/metricsDefinitions'

interface MetricsFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productId: string
  definition?: MetricsDefinition
}

export function MetricsForm({
  isOpen,
  onClose,
  onSuccess,
  productId,
  definition,
}: MetricsFormProps) {
  const [metricCode, setMetricCode] = useState('')
  const [metricName, setMetricName] = useState('')
  const [unit, setUnit] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!definition

  useEffect(() => {
    if (definition) {
      setMetricCode(definition.metric_code)
      setMetricName(definition.metric_name)
      setUnit(definition.unit)
      setDescription(definition.description)
    } else {
      setMetricCode('')
      setMetricName('')
      setUnit('')
      setDescription('')
    }
    setError(null)
  }, [definition, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing) {
        await updateMetricsDefinition(definition.id, {
          metric_name: metricName,
          unit,
          description,
        })
      } else {
        await createMetricsDefinition(productId, {
          metric_code: metricCode,
          metric_name: metricName,
          unit,
          description,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {isEditing ? 'メトリクス定義を編集' : 'メトリクス定義を新規登録'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="metric-code"
              className="block text-sm font-medium text-gray-700"
            >
              メトリクスコード
            </label>
            <input
              id="metric-code"
              type="text"
              value={metricCode}
              onChange={(e) => setMetricCode(e.target.value)}
              disabled={isEditing}
              required
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="metric-name"
              className="block text-sm font-medium text-gray-700"
            >
              メトリクス名
            </label>
            <input
              id="metric-name"
              type="text"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              required
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="metric-unit"
              className="block text-sm font-medium text-gray-700"
            >
              単位
            </label>
            <input
              id="metric-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="metric-description"
              className="block text-sm font-medium text-gray-700"
            >
              説明
            </label>
            <textarea
              id="metric-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
