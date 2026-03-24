import type { ContractStatus, ProductStatus, TrialStatus } from '../types/api';

type BadgeVariant = ContractStatus | ProductStatus | TrialStatus;

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
  converted: 'bg-blue-100 text-blue-800',
  expired: 'bg-yellow-100 text-yellow-800',
};

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  active: 'アクティブ',
  inactive: '非アクティブ',
  cancelled: 'キャンセル済',
  converted: '本契約転換',
  expired: '期限切れ',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = VARIANT_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  const label = VARIANT_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles} ${className}`}
      data-testid="status-badge"
      data-status={status}
    >
      {label}
    </span>
  );
}
