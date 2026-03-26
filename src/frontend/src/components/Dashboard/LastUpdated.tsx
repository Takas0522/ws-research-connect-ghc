interface LastUpdatedProps {
  lastUpdated: string | null
}

export function LastUpdated({ lastUpdated }: LastUpdatedProps) {
  const formatted = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <p className="text-sm text-gray-500">
      {formatted ? `最終更新: ${formatted}` : '未更新'}
    </p>
  )
}
