import { apiClient } from './client'

interface AdminUser {
  id: string
  email: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserCreateData {
  email: string
  display_name: string
  role: string
  password: string
}

interface UserUpdateData {
  display_name?: string
  role?: string
  is_active?: boolean
}

export async function fetchUsers(): Promise<AdminUser[]> {
  return apiClient<AdminUser[]>('/admin/users/')
}

export async function createUser(data: UserCreateData): Promise<AdminUser> {
  return apiClient<AdminUser>('/admin/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(userId: string, data: UserUpdateData): Promise<AdminUser> {
  return apiClient<AdminUser>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deactivateUser(userId: string): Promise<void> {
  await apiClient<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
  })
}
