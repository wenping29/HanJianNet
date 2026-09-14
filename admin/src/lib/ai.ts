import { PERIODS } from './format'
import type {
  AiTraitorResult,
  Child,
  CrimeRecord,
  LifeEvent,
  Period,
  Spouse,
  YearType,
} from '../types'

const YEAR_TYPES: YearType[] = ['exact', 'approx', 'before', 'after', 'unknown']

export function normalizeYearType(t: string | undefined | null): YearType {
  return YEAR_TYPES.includes(t as YearType) ? (t as YearType) : 'unknown'
}

export function normalizePeriod(p: string | undefined | null): string {
  const s = p?.trim() ?? ''
  if (!s || s === 'unknown' || s === '不详') return ''
  if (s === '其他') return '其他'
  if (s.includes('宋末')) return '宋末'
  if (s.includes('明末')) return '明末'
  if (s.includes('清末') || s.includes('晚清')) return '清末'
  if (s.includes('抗日战争') || s.includes('抗战')) return '抗日战争时期'
  if (s.includes('民国')) return '民国'
  return ''
}

export interface NormalizedAi {
  form: {
    name: string
    courtesyName: string
    pseudonym: string
    birthYear: string
    deathYear: string
    birthYearType: YearType
    deathYearType: YearType
    nativePlace: string
    birthPlace: string
    period: Period
    faction: string
    summary: string
    aliasesText: string
    identityTagsText: string
  }
  spouses: Spouse[]
  children: Child[]
  crimeRecords: CrimeRecord[]
  lifeEvents: LifeEvent[]
  photoNote: string
}

function validYear(y: number | null | undefined): number | null {
  return typeof y === 'number' && y >= 1 && y <= 2100 ? y : null
}

function validGender(g: string | null | undefined): string {
  return g === '男' || g === '女' || g === '不详' ? g : ''
}

export function normalizeAiResult(r: AiTraitorResult): NormalizedAi {
  const birthYear = validYear(r.birthYear)
  const deathYear = validYear(r.deathYear)
  const period = normalizePeriod(r.period) || '民国'

  return {
    form: {
      name: r.name?.trim() ?? '',
      courtesyName: r.courtesyName?.trim() ?? '',
      pseudonym: r.pseudonym?.trim() ?? '',
      birthYear: birthYear === null ? '' : String(birthYear),
      deathYear: deathYear === null ? '' : String(deathYear),
      birthYearType: birthYear === null ? 'unknown' : normalizeYearType(r.birthYearType),
      deathYearType: deathYear === null ? 'unknown' : normalizeYearType(r.deathYearType),
      nativePlace: r.nativePlace?.trim() ?? '',
      birthPlace: r.birthPlace?.trim() ?? '',
      period: (PERIODS as readonly string[]).includes(period) ? (period as Period) : '民国',
      faction: r.faction?.trim() ?? '',
      summary: r.summary?.trim() ?? '',
      aliasesText: (Array.isArray(r.aliases) ? r.aliases : []).join('，'),
      identityTagsText: (Array.isArray(r.identityTags) ? r.identityTags : []).join('，'),
    },
    spouses: (Array.isArray(r.spouses) ? r.spouses : []).map((s) => ({
      name: s?.name?.trim() ?? '',
      remark: s?.remark?.trim() || undefined,
    })),
    children: (Array.isArray(r.children) ? r.children : []).map((c) => ({
      name: c?.name?.trim() ?? '',
      gender: validGender(c?.gender),
      whereabouts: c?.whereabouts?.trim() || undefined,
      remark: c?.remark?.trim() || undefined,
    })),
    crimeRecords: (Array.isArray(r.crimeRecords) ? r.crimeRecords : []).map((c) => ({
      year: validYear(c?.year),
      title: c?.title?.trim() ?? '',
      process: c?.process?.trim() || undefined,
      harm: c?.harm?.trim() || undefined,
      sourceRef: c?.sourceRef?.trim() || undefined,
    })),
    lifeEvents: (Array.isArray(r.lifeEvents) ? r.lifeEvents : []).map((l) => ({
      year: validYear(l?.year),
      event: l?.event?.trim() ?? '',
      sourceRef: l?.sourceRef?.trim() || undefined,
    })),
    photoNote: r.photoNote?.trim() ?? '',
  }
}