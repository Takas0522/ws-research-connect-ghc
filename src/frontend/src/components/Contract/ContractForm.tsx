import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { Contract, ContractStatus, PrimaryUseCase, Product, Plan, Customer } from '../../types/api'
import type { ContractCreateInput, ContractUpdateInput } from '../../api/contracts'
import { fetchProducts } from '../../api/products'
import { fetchPlans } from '../../api/plans'
import { fetchCustomers } from '../../api/customers'

const USE_CASE_LABELS: Record<PrimaryUseCase, string> = {
  sales_ops: '営業支援',
  customer_support: 'カスタマーサポート',
  analytics: '分析',
  integration: 'システム連携',
  other: 'その他',
}

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'active', label: '有効' },
  { value: 'renewing', label: '更新中' },
  { value: 'suspended', label: '停止中' },
  { value: 'terminated', label: '解約済' },
]

interface ContractFormProps {
  contract: Contract | null
  onSubmit: (data: ContractCreateInput | ContractUpdateInput) => Promise<void>
  onClose: () => void
}

export function ContractForm({ contract, onSubmit, onClose }: ContractFormProps) {
  const isEdit = contract !== null

  const [customerId, setCustomerId] = useState(contract?.customer_id ?? '')
  const [productId, setProductId] = useState(contract?.product_id ?? '')
  const [currentPlanId, setCurrentPlanId] = useState(contract?.current_plan_id ?? '')
  const [contractStartDate, setContractStartDate] = useState(contract?.contract_start_date ?? '')
  const [contractEndDate, setContractEndDate] = useState(contract?.contract_end_date ?? '')
  const [contractRenewalDate, setContractRenewalDate] = useState(contract?.contract_renewal_date ?? '')
  const [licenseCount, setLicenseCount] = useState(contract?.license_count ?? 1)
  const [contractStatus, setContractStatus] = useState<ContractStatus>(contract?.status ?? 'active')
  const [primaryUseCase, setPrimaryUseCase] = useState<PrimaryUseCase>(contract?.primary_use_case ?? 'sales_ops')
  const [changeReason, setChangeReason] = useState('')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planOrLicenseChanged =
    isEdit &&
    (currentPlanId !== contract.current_plan_id || licenseCount !== contract.license_count)

  const loadCustomers = useCallback(async () => {
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch {
      // 非致命的エラー
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch {
      // 非致命的エラー
    }
  }, [])

  const loadPlans = useCallback(async (prodId: string) => {
    if (!prodId) {
      setPlans([])
      return
    }
    try {
      const data = await fetchPlans(prodId)
      setPlans(data)
    } catch {
      setPlans([])
    }
  }, [])

  useEffect(() => {
    void loadCustomers()
    void loadProducts()
  }, [loadCustomers, loadProducts])

  useEffect(() => {
    void loadPlans(productId)
  }, [productId, loadPlans])

  const handleProductChange = (newProductId: string) => {
    setProductId(newProductId)
    setCurrentPlanId('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        const data: ContractUpdateInput = {
          current_plan_id: currentPlanId !== contract.current_plan_id ? currentPlanId : undefined,
          contract_end_date: contractEndDate || null,
          contract_renewal_date: contractRenewalDate !== contract.contract_renewal_date ? contractRenewalDate : undefined,
          license_count: licenseCount !== contract.license_count ? licenseCount : undefined,
          status: contractStatus !== contract.status ? contractStatus : undefined,
          primary_use_case: primaryUseCase !== contract.primary_use_case ? primaryUseCase : undefined,
          change_reason: changeReason || undefined,
        }
        // 変更なしのフィールドを除外
        const cleanData: ContractUpdateInput = {}
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            (cleanData as Record<string, unknown>)[key] = value
          }
        }
        await onSubmit(cleanData)
      } else {
        const data: ContractCreateInput = {
          customer_id: customerId,
          product_id: productId,
          current_plan_id: currentPlanId,
          contract_start_date: contractStartDate,
          contract_end_date: contractEndDate || undefined,
          contract_renewal_date: contractRenewalDate,
          license_count: licenseCount,
          status: contractStatus,
          primary_use_case: primaryUseCase,
        }
        await onSubmit(data)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {isEdit ? '契約編集' : '契約新規登録'}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contract-customer" className="block text-sm font-medium text-gray-700">
              顧客
            </label>
            <select
              id="contract-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              disabled={isEdit}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">選択してください</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contract-product" className="block text-sm font-medium text-gray-700">
              製品
            </label>
            <select
              id="contract-product"
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              disabled={isEdit}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">選択してください</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contract-plan" className="block text-sm font-medium text-gray-700">
              プラン
            </label>
            <select
              id="contract-plan"
              value={currentPlanId}
              onChange={(e) => setCurrentPlanId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.plan_name} (¥{p.monthly_base_fee.toLocaleString()}/月)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contract-start-date" className="block text-sm font-medium text-gray-700">
                契約開始日
              </label>
              <input
                id="contract-start-date"
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
                required
                disabled={isEdit}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div>
              <label htmlFor="contract-end-date" className="block text-sm font-medium text-gray-700">
                契約終了日
              </label>
              <input
                id="contract-end-date"
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contract-renewal-date" className="block text-sm font-medium text-gray-700">
              契約更新日
            </label>
            <input
              id="contract-renewal-date"
              type="date"
              value={contractRenewalDate}
              onChange={(e) => setContractRenewalDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contract-license-count" className="block text-sm font-medium text-gray-700">
                ライセンス数
              </label>
              <input
                id="contract-license-count"
                type="number"
                min={1}
                value={licenseCount}
                onChange={(e) => setLicenseCount(Number(e.target.value))}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="contract-status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="contract-status"
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value as ContractStatus)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="contract-use-case" className="block text-sm font-medium text-gray-700">
              主な利用目的
            </label>
            <select
              id="contract-use-case"
              value={primaryUseCase}
              onChange={(e) => setPrimaryUseCase(e.target.value as PrimaryUseCase)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {(Object.entries(USE_CASE_LABELS) as [PrimaryUseCase, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isEdit && planOrLicenseChanged && (
            <div>
              <label htmlFor="contract-change-reason" className="block text-sm font-medium text-gray-700">
                変更理由
              </label>
              <textarea
                id="contract-change-reason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                required
                rows={2}
                placeholder="プラン・ライセンス変更の理由を入力してください"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
