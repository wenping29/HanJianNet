import type { AtrocityCasePerson, AtrocityEvent, AtrocityEventInput, Period } from '../types'
import { api } from './api'
import { PERIODS } from './format'

export interface HistoryEvent {
  id: string
  year: number | null
  era: Period
  period: Period
  title: string
  alias?: string
  desc: string
  /** 事件类型（惨案 / 宏观事件等） */
  eventType?: string
  /** 关联汉奸检索关键词（匹配档案生平事件文本） */
  keywords: string[]
  /** 省份（详情展示用） */
  province?: string
  /** 城市（详情展示用） */
  city?: string
  /** 事件地点（详情展示用） */
  location?: string
  /** 涉案人员（详情接口返回） */
  persons?: AtrocityCasePerson[]
  /** 已知涉案人数（数据库中已录入） */
  personCount?: number
}

export const HISTORY_ERAS = ['全部', ...PERIODS] as const

/** 时期 → 数据模型 Period 映射 */
export const ERA_PERIOD_MAP: Record<HistoryEvent['era'], Period> = {
  宋末: PERIODS[0],
  明末: PERIODS[1],
  清末: PERIODS[2],
  抗日战争时期: PERIODS[3],
  民国: PERIODS[4],
  其他: PERIODS[5],
}

/** 数据库 Era 字符串 → 前端 Period（空值/未识别归一为"其他"） */
function normalizeEra(era: string): Period {
  const e = era.trim() as Period
  return e in ERA_PERIOD_MAP ? e : '其他'
}

/** 后端事件 → 前端 HistoryEvent */
function toHistoryEvent(ev: AtrocityEvent): HistoryEvent {
  const era = normalizeEra(ev.era)
  return {
    id: ev.id,
    year: ev.year,
    era,
    period: ERA_PERIOD_MAP[era],
    title: ev.name,
    alias: ev.alias || undefined,
    desc: ev.summary,
    eventType: ev.eventType || undefined,
    keywords: ev.keywords ?? [],
    province: ev.province || undefined,
    city: ev.city || undefined,
    location: ev.location || undefined,
    persons: ev.persons,
    personCount: ev.personCount,
  }
}

/** 全部事件（按年份升序，空年份置后） */
export async function getAllHistoryEvents(era?: string): Promise<HistoryEvent[]> {
  const res = await api.listAtrocityEvents(era)
  return res.items.map(toHistoryEvent).sort((a, b) => (a.year ?? Infinity) - (b.year ?? Infinity))
}

export async function findHistoryEvent(id: string): Promise<HistoryEvent | null> {
  const res = await api.getAtrocityEvent(id)
  return toHistoryEvent(res.item)
}

/** 提交一条新事件（需登录） */
export function addCustomEvent(input: AtrocityEventInput): Promise<AtrocityEvent> {
  return api.createAtrocityEvent(input).then((r) => r.item)
}