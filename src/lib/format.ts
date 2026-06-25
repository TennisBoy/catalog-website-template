import type { Item } from '../types'

/** Distinct titles = number of item rows. */
export function titleCount(items: Item[]): number {
  return items.length
}

/** Total physical copies = sum of quantities. */
export function copyCount(items: Item[]): number {
  return items.reduce((sum, it) => sum + (Number.isFinite(it.quantity) ? it.quantity : 0), 0)
}

/** Compact relative time, e.g. "2m", "3h", "5d", "Jun 4". */
export function relativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'unknown'
  const sec = Math.max(0, Math.round((now - then) / 1000))
  if (sec < 45) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** YYYY-MM-DD stamp for filenames. */
export function dateStamp(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}
