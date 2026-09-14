import type { YearType } from '../types'

export const PERIODS = ['宋末', '明末', '清末', '民国',"抗日战争时期", '其他'] as const

export function splitList(text: string): string[] {
  return text
    .split(/[,，、;；]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

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

/** 危害度分级：1=特级（最严重）… 7=己级（最低）；null/undefined 表示未分级 */
export const HARM_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

const HARM_LEVEL_CLASS: Record<number, string> = {
  1: 'border-cinnabar bg-cinnabar/25 text-cinnabarlight',
  2: 'border-cinnabar/70 bg-cinnabar/15 text-cinnabarlight/90',
  3: 'border-bronze/70 bg-bronze/15 text-bronzelight',
  4: 'border-bronze/40 bg-bronze/10 text-bronzelight/90',
  5: 'border-paperedge/30 text-paperdim',
  6: 'border-paperedge/25 text-paperdim/80',
  7: 'border-paperedge/20 text-paperdim/60',
}

/** 危害等级徽标配色：级别越高越醒目 */
export function harmLevelClass(level: number | null | undefined): string {
  if (level == null) return ''
  return HARM_LEVEL_CLASS[level] ?? 'border-paperedge/30 text-paperdim'
}
