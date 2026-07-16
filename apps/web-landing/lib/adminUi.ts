export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function revenueBarHeight(value: number, maximum: number): number {
  if (maximum <= 0 || value <= 0) return 0
  return Math.min(100, Math.round((value / maximum) * 100))
}

export function formatVnd(value: number | string | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value ?? 0))} đ`
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}
