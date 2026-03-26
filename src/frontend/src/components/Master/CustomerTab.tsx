import { useState, useEffect, useCallback } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { CustomerForm } from './CustomerForm'
import { fetchSalesUsers } from '../../api/users'
import type { SalesUser } from '../../api/users'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '../../api/customers'

export function CustomerTab() {
  const { customers, loading, error, refetch, addCustomer, editCustomer, removeCustomer } = useCustomers()
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([])

  const loadSalesUsers = useCallback(async () => {
    try {
      const users = await fetchSalesUsers()
      setSalesUsers(users)
    } catch {
      // 営業ユーザーの取得失敗は表示に影響しない
    }
  }, [])

  useEffect(() => {
    void loadSalesUsers()
  }, [loadSalesUsers])

  const getSalesUserName = (userId: string | null): string => {
    if (!userId) return '—'
    const user = salesUsers.find((u) => u._id === userId)
    return user?.display_name ?? '—'
  }

  const handleCreate = () => {
    setEditingCustomer(null)
    setShowForm(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`「${customer.customer_name}」を削除しますか？`)) return
    try {
      await removeCustomer(customer.id)
    } catch {
      // エラーは useCustomers 側で管理
    }
  }

  const handleSubmit = async (data: CustomerCreateInput | CustomerUpdateInput) => {
    if (editingCustomer) {
      await editCustomer(editingCustomer.id, data as CustomerUpdateInput)
    } else {
      await addCustomer(data as CustomerCreateInput)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          再読み込み
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">顧客一覧</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          新規登録
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
          顧客が登録されていません
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  顧客コード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  顧客名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  担当営業
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  担当者名
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {customer.customer_code}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {customer.customer_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {getSalesUserName(customer.assigned_sales_user_id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {customer.contact_person ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <button
                      type="button"
                      onClick={() => handleEdit(customer)}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(customer)}
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

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
