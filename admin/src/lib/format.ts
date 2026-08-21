import type { YearType } from '../types'

export function formatYear(year: number | null, type: YearType): string {
  if (type === 'unknown' || year === null || Number.isNaN(year)) return '不详'
  const prefix = type === 'approx' ? '约' : ''
  const suffix = type === 'before' ? '前' : type === 'after' ? '后' : ''
  return `${prefix}${year}${suffix}`
}

export function formatLifeSpan(
  birthYear: number | null,
  deathYear: number | null,
  birthYearType: YearType,
  deathYearType: YearType,
): string {
  return `${formatYear(birthYear, birthYearType)} — ${formatYear(deathYear, deathYearType)}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
