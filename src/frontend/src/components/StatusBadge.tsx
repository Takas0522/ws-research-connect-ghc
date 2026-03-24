import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'product' | 'contract' | 'trial';
}

const colorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  beta: 'bg-yellow-100 text-yellow-800',
  discontinued: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  converted: 'bg-blue-100 text-blue-800',
  expired: 'bg-gray-100 text-gray-600',
  monthly: 'bg-sky-100 text-sky-800',
  yearly: 'bg-indigo-100 text-indigo-800',
};

const labelMap: Record<string, string> = {
  active: 'アクティブ',
  beta: 'ベータ',
  discontinued: '終了',
  cancelled: '解約済',
  converted: '転換済',
  expired: '期限切れ',
  monthly: '月額',
  yearly: '年額',
};

export default function StatusBadge({ status }: StatusBadgeProps): ReactNode {
  const color = colorMap[status] ?? 'bg-gray-100 text-gray-700';
  const label = labelMap[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
