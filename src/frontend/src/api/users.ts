import { apiClient } from './client'

export interface SalesUser {
  _id: string
  email: string
  display_name: string
}

export async function fetchSalesUsers(): Promise<SalesUser[]> {
  return apiClient<SalesUser[]>('/users/sales')
}
