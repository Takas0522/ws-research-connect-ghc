const yenFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
});

export function formatYen(amount: number): string {
  return yenFormatter.format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP');
}

export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-');
  return `${year}年${month}月`;
}
