import { useState } from 'react'
import { usePlans } from '../../hooks/usePlans'
import { deletePlan, type Plan } from '../../api/plans'
import { PlanForm } from './PlanForm'

const formatCurrency = (amount: number): string =>
  `¥${new Intl.NumberFormat('ja-JP').format(amount)}`

interface PlanTabProps {
  productId: string | null
}

export function PlanTab({ productId }: PlanTabProps) {
  const { plans, loading, error, refetch } = usePlans(productId)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    try {
      await deletePlan(id)
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingPlan(undefined)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingPlan(undefined)
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingPlan(undefined)
    await refetch()
  }

  const toggleExpand = (planId: string) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId))
  }

  if (!productId) {
    return (
      <div className="rounded-md bg-gray-50 py-12 text-center">
        <p className="text-gray-500">製品を選択してください</p>
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
        <h2 className="text-lg font-semibold text-gray-900">プラン</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規登録
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-12 text-center">
          <p className="text-gray-500">プランが登録されていません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  プランコード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  プラン名
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  月額基本料
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  アラート閾値
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {plans.map((plan) => (
                <tr key={plan.id} className="group">
                  <td className="whitespace-nowrap px-6 py-4">
                    <button
                      type="button"
                      onClick={() => toggleExpand(plan.id)}
                      className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span
                        className={`inline-block transition-transform ${
                          expandedPlanId === plan.id ? 'rotate-90' : ''
                        }`}
                      >
                        ▶
                      </span>
                      {plan.plan_code}
                    </button>
                    {/* メトリクス上限展開セクション */}
                    {expandedPlanId === plan.id &&
                      plan.metric_limits.length > 0 && (
                        <div className="mt-2 rounded-md bg-gray-50 p-3">
                          <p className="mb-1 text-xs font-medium text-gray-500">
                            メトリクス上限
                          </p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="pb-1 text-left">コード</th>
                                <th className="pb-1 text-right">上限値</th>
                                <th className="pb-1 text-right">超過単価</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plan.metric_limits.map((ml, idx) => (
                                <tr key={idx} className="text-gray-700">
                                  <td className="py-0.5">{ml.metric_code}</td>
                                  <td className="py-0.5 text-right">
                                    {new Intl.NumberFormat('ja-JP').format(
                                      ml.limit_value,
                                    )}
                                  </td>
                                  <td className="py-0.5 text-right">
                                    {formatCurrency(ml.overage_unit_price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    {expandedPlanId === plan.id &&
                      plan.metric_limits.length === 0 && (
                        <div className="mt-2 rounded-md bg-gray-50 p-2">
                          <p className="text-xs text-gray-400">
                            メトリクス上限なし
                          </p>
                        </div>
                      )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {plan.plan_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    {formatCurrency(plan.monthly_base_fee)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    {plan.alert_threshold_pct}%
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleEdit(plan)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(plan.id)}
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
        <PlanForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={() => void handleFormSuccess()}
          productId={productId}
          plan={editingPlan}
        />
      )}
    </div>
  )
}
