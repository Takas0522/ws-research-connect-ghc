import { useState, useEffect, useCallback } from 'react'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers'
import type { Customer, CustomerCreateInput, CustomerUpdateInput } from '../api/customers'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomers()
      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '顧客の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const addCustomer = useCallback(async (data: CustomerCreateInput): Promise<void> => {
    await createCustomer(data)
    await refetch()
  }, [refetch])

  const editCustomer = useCallback(async (id: string, data: CustomerUpdateInput): Promise<void> => {
    await updateCustomer(id, data)
    await refetch()
  }, [refetch])

  const removeCustomer = useCallback(async (id: string): Promise<void> => {
    await deleteCustomer(id)
    await refetch()
  }, [refetch])

  return { customers, loading, error, refetch, addCustomer, editCustomer, removeCustomer }
}
