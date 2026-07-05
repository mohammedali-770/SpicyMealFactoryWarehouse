import { subDays } from 'date-fns'
import { businessDate } from '@/lib/datetime'

type Cell = string | number | null | undefined

/** Serialize rows to CSV (RFC-4180 quoting). Values with quote/comma/newline are quoted. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  const esc = (v: Cell) => {
    const s = v == null ? '' : String(v)
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

/** Trigger a client-side download of CSV text. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Inclusive [from, to] business-day range ending today, spanning n days (Asia/Riyadh). */
export function lastNDays(now: Date, n: number): { from: string; to: string } {
  return { from: businessDate(subDays(now, n - 1)), to: businessDate(now) }
}
