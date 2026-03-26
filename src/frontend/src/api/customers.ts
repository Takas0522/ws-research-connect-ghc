import { apiClient } from './client'

export interface Customer {
  id: string
  customer_code: string
  customer_name: string
  assigned_sales_user_id: string | null
  contact_person: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerCreateInput {
  customer_code: string
  customer_name: string
  assigned_sales_user_id?: string | null
  contact_person?: string | null
  notes?: string | null
}

export interface CustomerUpdateInput {
  customer_name?: string | null
  assigned_sales_user_id?: string | null
  contact_person?: string | null
  notes?: string | null
}

export async function fetchCustomers(): Promise<Customer[]> {
  return apiClient<Customer[]>('/customers/')
}

export async function fetchCustomer(id: string): Promise<Customer> {
  return apiClient<Customer>(`/customers/${id}`)
}

export async function createCustomer(data: CustomerCreateInput): Promise<Customer> {
  return apiClient<Customer>('/customers/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCustomer(id: string, data: CustomerUpdateInput): Promise<Customer> {
  return apiClient<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient<void>(`/customers/${id}`, {
    method: 'DELETE',
  })
}
