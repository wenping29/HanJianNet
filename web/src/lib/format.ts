import type { YearType, Period, EraDef } from '../types'

export const PERIODS = ['宋末', '明末', '清末', '民国', '抗日战争时期', '其他'] as const

const PERIOD_I18N: Record<Period, string> = {
  宋末: 'period.lateSong',
  明末: 'period.lateMing',
  清末: 'period.lateQing',
  民国: 'period.republic',
  抗日战争时期: 'period.warOfResistance',
  其他: 'period.other',
}

export function periodLabel(period: Period, t: (key: string) => string): string {
  return t(PERIOD_I18N[period])
}

// 时光轴时期定义（按年份区间前端过滤）
export const ERAS: EraDef[] = [
  { label: '全部', range: '不限', desc: '依年序铺陈所有已收录的重大变节事件。' },
  { label: '宋末', range: '1234 — 1279', desc: '宋元鼎革之际，出仕蒙元或献城降敌者。', from: 1234, to: 1279 },
  { label: '明末', range: '1616 — 1662', desc: '明清易代之际，降清仕清、助清剿明者。', from: 1616, to: 1662 },
  { label: '清末', range: '1840 — 1912', desc: '列强侵凌之世，勾结外敌、出卖利权者。', from: 1840, to: 1912 },
  { label: '民国', range: '1912 — 1945', desc: '民国时期，投靠日本侵略者、充任伪职者。', from: 1912, to: 1945 },
  { label: '抗日战争时期', range: '1931 — 1945', desc: '抗日战争时期，投靠日本侵略者、充任伪职者。', from: 1931, to: 1945 },
  { label: '其他', range: '其他', desc: '其他时期，未被分类的事件。' }
]

const ERA_I18N: Record<string, string> = {
  '全部': 'era.all',
  '宋末': 'era.lateSong',
  '明末': 'era.lateMing',
  '清末': 'era.lateQing',
  '民国': 'era.republic',
  '抗日战争时期': 'era.warOfResistance',
  '其他': 'era.other',
}

export function eraLabel(era: string, t: (key: string) => string): string {
  const i18nKey = ERA_I18N[era]
  return i18nKey ? t(i18nKey) : era
}

export const PERIOD_META: Record<Period, { range: string; desc: string }> = {
  宋末: { range: '1276 — 1279', desc: '宋元鼎革之际，出仕蒙元或献城降敌者。' },
  明末: { range: '1644 — 1662', desc: '明清易代之际，降清仕清、助清剿明者。' },
  清末: { range: '1840 — 1912', desc: '列强侵凌之世，勾结外敌、出卖利权者。' },
  民国: { range: '1912 — 1949', desc: '抗战前后，投靠日本侵略者、充任伪职者。' },
  抗日战争时期: { range: '1931 — 1945', desc: '抗日战争时期，投靠日本侵略者、充任伪职者。' },
  其他: { range: '不限', desc: '不属于上述时期，但符合认定标准的变节者。' },
}

export const YEAR_TYPE_LABEL: Record<YearType, string> = {
  exact: '',
  approx: '约',
  before: '之前',
  after: '之后',
  unknown: '不详',
}

export function formatYear(year: number | null, type: YearType, t?: (key: string) => string): string {
  const fmt = t ?? ((k: string) => k)
  if (type === 'unknown' || year === null || Number.isNaN(year)) return fmt('format.unknown')
  const prefix = type === 'approx' ? fmt('format.circa') : ''
  const suffix = type === 'before' ? fmt('format.before') : type === 'after' ? fmt('format.after') : ''
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

export function splitList(text: string): string[] {
  return text
    .split(/[,，、;；]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 加密姓名第二个字：如"张三丰"→"张**丰"，"王二"→"王*"，"李"→"李"
 */
export function maskName(name: string): string {
  if (!name) return name
  const chars = Array.from(name)
  if (chars.length <= 1) return name
  if (chars.length === 2) return `${chars[0]}*`
  // 第二个字用 ** 替换
  return `${chars[0]}${'*'.repeat(Math.min(chars.length - 1, 2))}${chars.slice(2).join('')}`
}
