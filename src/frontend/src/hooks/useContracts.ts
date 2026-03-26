import { useState, useEffect, useCallback } from 'react'
import { fetchContracts, createContract, updateContract } from '../api/contracts'
import type { ContractCreateInput, ContractUpdateInput } from '../api/contracts'
import type { Contract } from '../types/api'

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchContracts()
      setContracts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '契約の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const addContract = useCallback(async (data: ContractCreateInput): Promise<void> => {
    await createContract(data)
    await refetch()
  }, [refetch])

  const editContract = useCallback(async (id: string, data: ContractUpdateInput): Promise<void> => {
    await updateContract(id, data)
    await refetch()
  }, [refetch])

  return { contracts, loading, error, refetch, addContract, editContract }
}
