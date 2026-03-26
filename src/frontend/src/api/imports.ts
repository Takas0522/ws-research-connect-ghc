import { apiClient, getToken } from './client'
import type { ImportPreview, UsageImport } from '../types/api'

export async function uploadCsv(file: File): Promise<ImportPreview> {
  const formData = new FormData()
  formData.append('file', file)

  const token = getToken()
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch('/api/imports/upload', {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    let detail = `HTTP ${response.status}`
    try {
      const errorBody = (await response.json()) as { detail?: string }
      if (errorBody.detail) {
        detail = errorBody.detail
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(detail)
  }

  return response.json() as Promise<ImportPreview>
}

export async function confirmImport(importId: string): Promise<UsageImport> {
  return apiClient<UsageImport>(`/imports/${importId}/confirm`, {
    method: 'POST',
  })
}

export async function fetchImportHistory(): Promise<UsageImport[]> {
  return apiClient<UsageImport[]>('/imports/')
}
