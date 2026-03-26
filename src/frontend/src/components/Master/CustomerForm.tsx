import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '../../api/customers'
import { fetchSalesUsers } from '../../api/users'
import type { SalesUser } from '../../api/users'

interface CustomerFormProps {
  customer: Customer | null
  onSubmit: (data: CustomerCreateInput | CustomerUpdateInput) => Promise<void>
  onClose: () => void
}

export function CustomerForm({ customer, onSubmit, onClose }: CustomerFormProps) {
  const isEdit = customer !== null

  const [customerCode, setCustomerCode] = useState(customer?.customer_code ?? '')
  const [customerName, setCustomerName] = useState(customer?.customer_name ?? '')
  const [assignedSalesUserId, setAssignedSalesUserId] = useState(customer?.assigned_sales_user_id ?? '')
  const [contactPerson, setContactPerson] = useState(customer?.contact_person ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSalesUsers = useCallback(async () => {
    try {
      const users = await fetchSalesUsers()
      setSalesUsers(users)
    } catch {
      // 営業ユーザー取得失敗は致命的ではない
    }
  }, [])

  useEffect(() => {
    void loadSalesUsers()
  }, [loadSalesUsers])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        const data: CustomerUpdateInput = {
          customer_name: customerName,
          assigned_sales_user_id: assignedSalesUserId || null,
          contact_person: contactPerson || null,
          notes: notes || null,
        }
        await onSubmit(data)
      } else {
        const data: CustomerCreateInput = {
          customer_code: customerCode,
          customer_name: customerName,
          assigned_sales_user_id: assignedSalesUserId || null,
          contact_person: contactPerson || null,
          notes: notes || null,
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
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          {isEdit ? '顧客編集' : '顧客新規登録'}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customer-code" className="block text-sm font-medium text-gray-700">
              顧客コード
            </label>
            <input
              id="customer-code"
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              disabled={isEdit}
              required
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700">
              顧客名
            </label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="assigned-sales-user" className="block text-sm font-medium text-gray-700">
              担当営業
            </label>
            <select
              id="assigned-sales-user"
              value={assignedSalesUserId}
              onChange={(e) => setAssignedSalesUserId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">未割当</option>
              {salesUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.display_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact-person" className="block text-sm font-medium text-gray-700">
              担当者名
            </label>
            <input
              id="contact-person"
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              備考
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

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
