import type { TokenResponse, User } from '../types/api'
import { apiClient } from './client'

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const errorBody = await response.json() as { detail?: string }
      if (errorBody.detail) {
        detail = errorBody.detail
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail)
  }

  return response.json() as Promise<TokenResponse>
}

export async function fetchCurrentUser(): Promise<User> {
  return apiClient<User>('/auth/me')
}
