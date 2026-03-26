import { useState, useEffect } from 'react'
import { createPlan, updatePlan, type Plan, type MetricLimit } from '../../api/plans'

interface PlanFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productId: string
  plan?: Plan
}

interface MetricLimitRow {
  metric_code: string
  limit_value: string
  overage_unit_price: string
}

const EMPTY_METRIC_ROW: MetricLimitRow = {
  metric_code: '',
  limit_value: '',
  overage_unit_price: '',
}

export function PlanForm({ isOpen, onClose, onSuccess, productId, plan }: PlanFormProps) {
  const [planCode, setPlanCode] = useState('')
  const [planName, setPlanName] = useState('')
  const [monthlyBaseFee, setMonthlyBaseFee] = useState('')
  const [alertThresholdPct, setAlertThresholdPct] = useState('90')
  const [metricLimits, setMetricLimits] = useState<MetricLimitRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!plan

  useEffect(() => {
    if (plan) {
      setPlanCode(plan.plan_code)
      setPlanName(plan.plan_name)
      setMonthlyBaseFee(String(plan.monthly_base_fee))
      setAlertThresholdPct(String(plan.alert_threshold_pct))
      setMetricLimits(
        plan.metric_limits.map((ml) => ({
          metric_code: ml.metric_code,
          limit_value: String(ml.limit_value),
          overage_unit_price: String(ml.overage_unit_price),
        })),
      )
    } else {
      setPlanCode('')
      setPlanName('')
      setMonthlyBaseFee('')
      setAlertThresholdPct('90')
      setMetricLimits([])
    }
    setError(null)
  }, [plan, isOpen])

  const handleAddMetricLimit = () => {
    setMetricLimits((prev) => [...prev, { ...EMPTY_METRIC_ROW }])
  }

  const handleRemoveMetricLimit = (index: number) => {
    setMetricLimits((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMetricLimitChange = (
    index: number,
    field: keyof MetricLimitRow,
    value: string,
  ) => {
    setMetricLimits((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    )
  }

  const buildMetricLimits = (): MetricLimit[] =>
    metricLimits
      .filter((ml) => ml.metric_code.trim() !== '')
      .map((ml) => ({
        metric_code: ml.metric_code.trim(),
        limit_value: Number(ml.limit_value) || 0,
        overage_unit_price: Number(ml.overage_unit_price) || 0,
      }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing) {
        await updatePlan(plan.id, {
          plan_name: planName,
          monthly_base_fee: Number(monthlyBaseFee),
          alert_threshold_pct: Number(alertThresholdPct),
          metric_limits: buildMetricLimits(),
        })
      } else {
        await createPlan(productId, {
          plan_code: planCode,
          plan_name: planName,
          monthly_base_fee: Number(monthlyBaseFee),
          alert_threshold_pct: Number(alertThresholdPct),
          metric_limits: buildMetricLimits(),
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {isEditing ? 'プランを編集' : 'プランを新規登録'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="plan-code"
              className="block text-sm font-medium text-gray-700"
            >
              プランコード
            </label>
            <input
              id="plan-code"
              type="text"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              disabled={isEditing}
              required
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="plan-name"
              className="block text-sm font-medium text-gray-700"
            >
              プラン名
            </label>
            <input
              id="plan-name"
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              required
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="monthly-base-fee"
              className="block text-sm font-medium text-gray-700"
            >
              月額基本料（円）
            </label>
            <input
              id="monthly-base-fee"
              type="number"
              min="0"
              step="1"
              value={monthlyBaseFee}
              onChange={(e) => setMonthlyBaseFee(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="alert-threshold-pct"
              className="block text-sm font-medium text-gray-700"
            >
              アラート閾値（%）
            </label>
            <input
              id="alert-threshold-pct"
              type="number"
              min="1"
              max="100"
              value={alertThresholdPct}
              onChange={(e) => setAlertThresholdPct(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* メトリクス上限セクション */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                メトリクス上限
              </span>
              <button
                type="button"
                onClick={handleAddMetricLimit}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                メトリクス上限を追加
              </button>
            </div>
            {metricLimits.length > 0 && (
              <div className="space-y-3">
                {metricLimits.map((row, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-gray-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMetricLimit(index)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label
                          htmlFor={`metric-code-${index}`}
                          className="block text-xs text-gray-600"
                        >
                          メトリクスコード
                        </label>
                        <input
                          id={`metric-code-${index}`}
                          type="text"
                          value={row.metric_code}
                          onChange={(e) =>
                            handleMetricLimitChange(
                              index,
                              'metric_code',
                              e.target.value,
                            )
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`limit-value-${index}`}
                          className="block text-xs text-gray-600"
                        >
                          上限値
                        </label>
                        <input
                          id={`limit-value-${index}`}
                          type="number"
                          min="0"
                          step="any"
                          value={row.limit_value}
                          onChange={(e) =>
                            handleMetricLimitChange(
                              index,
                              'limit_value',
                              e.target.value,
                            )
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`overage-price-${index}`}
                          className="block text-xs text-gray-600"
                        >
                          超過単価
                        </label>
                        <input
                          id={`overage-price-${index}`}
                          type="number"
                          min="0"
                          step="any"
                          value={row.overage_unit_price}
                          onChange={(e) =>
                            handleMetricLimitChange(
                              index,
                              'overage_unit_price',
                              e.target.value,
                            )
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
