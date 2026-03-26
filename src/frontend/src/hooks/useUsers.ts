import { useState, useEffect, useCallback } from 'react'
import { fetchUsers } from '../api/adminUsers'

interface User {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { users, loading, error, refetch: fetchData }
}
