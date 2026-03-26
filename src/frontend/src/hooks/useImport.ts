import { useState, useCallback, useEffect } from 'react'
import { uploadCsv, confirmImport, fetchImportHistory } from '../api/imports'
import type { ImportPreview, UsageImport } from '../types/api'

type ImportPhase = 'idle' | 'uploading' | 'previewing' | 'confirming' | 'done' | 'error'

export function useImport() {
  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importHistory, setImportHistory] = useState<UsageImport[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await fetchImportHistory()
      setImportHistory(data)
    } catch (err) {
      // 履歴取得エラーは静かに処理
      console.error('履歴取得エラー:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  const uploadFile = useCallback(async (file: File) => {
    setPhase('uploading')
    setError(null)
    setPreview(null)
    try {
      const result = await uploadCsv(file)
      setPreview(result)
      setPhase('previewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
      setPhase('error')
    }
  }, [])

  const confirmUpload = useCallback(async () => {
    if (!preview) return
    setPhase('confirming')
    setError(null)
    try {
      await confirmImport(preview.import_id)
      setPhase('done')
      void fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : '確定に失敗しました')
      setPhase('error')
    }
  }, [preview, fetchHistory])

  const reset = useCallback(() => {
    setPhase('idle')
    setPreview(null)
    setError(null)
  }, [])

  return {
    phase,
    preview,
    error,
    importHistory,
    historyLoading,
    uploadFile,
    confirmUpload,
    reset,
    fetchHistory,
  }
}
