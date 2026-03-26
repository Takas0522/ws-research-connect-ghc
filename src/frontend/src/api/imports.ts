import { apiClient } from './client'
import type { ImportPreview, UsageImport } from '../types/api'

export async function uploadCsv(file: File): Promise<ImportPreview> {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient<ImportPreview>('/imports/upload', {
    method: 'POST',
    body: formData,
  })
}

export async function confirmImport(importId: string): Promise<UsageImport> {
  return apiClient<UsageImport>(`/imports/${importId}/confirm`, {
    method: 'POST',
  })
}

export async function fetchImportHistory(): Promise<UsageImport[]> {
  return apiClient<UsageImport[]>('/imports/')
}
