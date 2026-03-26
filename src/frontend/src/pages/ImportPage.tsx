import { useImport } from '../hooks/useImport'
import { FileUpload } from '../components/Import/FileUpload'
import { ImportPreview } from '../components/Import/ImportPreview'
import { ImportHistory } from '../components/Import/ImportHistory'

export function ImportPage() {
  const {
    phase,
    preview,
    error,
    importHistory,
    historyLoading,
    uploadFile,
    confirmUpload,
    reset,
  } = useImport()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">データ取込</h1>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                やり直す
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 確定完了メッセージ */}
      {phase === 'done' && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-700">データの取込が完了しました。</p>
              <button
                type="button"
                onClick={reset}
                className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
              >
                新しいファイルをアップロード
              </button>
            </div>
          </div>
        </div>
      )}

      {/* アップロードフォーム（idle / uploading / done / error 時に表示） */}
      {(phase === 'idle' || phase === 'uploading') && (
        <FileUpload onUpload={uploadFile} isUploading={phase === 'uploading'} />
      )}

      {/* プレビュー（previewing / confirming 時に表示） */}
      {(phase === 'previewing' || phase === 'confirming') && preview && (
        <ImportPreview
          preview={preview}
          onConfirm={confirmUpload}
          onCancel={reset}
          isConfirming={phase === 'confirming'}
        />
      )}

      {/* 取込履歴（常に表示） */}
      <ImportHistory imports={importHistory} loading={historyLoading} />
    </div>
  )
}
