interface RenewalAlertProps {
  renewalDate: string
}

export function RenewalAlert({ renewalDate }: RenewalAlertProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(renewalDate)
  renewal.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays > 30) return null

  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        更新まで{diffDays}日
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
      更新まで{diffDays}日
    </span>
  )
}
