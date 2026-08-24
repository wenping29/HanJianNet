import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DefinitionDrawer from '../components/DefinitionDrawer'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { PERIODS, PERIOD_META } from '../lib/format'
import type { TraitorStats, TraitorSummary } from '../types'

import { containerPageStyle } from '../style'



function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const from = prevRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else prevRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function StatCard({ label, value }: { label: string; value: number }) {
  const n = useCountUp(value)
  return (
    <div className="card border-bronze/40 p-6 text-center">
      <p className="font-garamond text-4xl font-semibold text-paper">{n}</p>
      <p className="mt-2 text-xs tracking-[0.3em] text-paperdim">{label}</p>
    </div>
  )
}

const EMPTY_FILTERS: TraitorFilters = { name: '', yearFrom: undefined, yearTo: undefined, event: '', period: undefined }

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stats, setStats] = useState<TraitorStats | null>(null)
  const [filters, setFilters] = useState<TraitorFilters>(EMPTY_FILTERS)
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const wallRef = useRef<HTMLDivElement>(null)

  const loadList = useCallback(async (f: TraitorFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listTraitors(f)
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList(EMPTY_FILTERS)
    api.getStats().then(setStats).catch(() => setStats(null))
  }, [loadList])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    loadList(filters)
    wallRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function pickPeriod(period?: string) {
    const next = { ...filters, period: period as TraitorFilters['period'] }
    setFilters(next)
    loadList(next)
  }

 

  return (
    <div>
      {/* 英雄区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-24 text-center md:py-32">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">HANJIAN HISTORICAL ARCHIVES</p>
          <h1 className="mt-5 max-w-3xl font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            青史为鉴<span className="mx-3 text-cinnabar">·</span>汉奸档案
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            集中收录近代变节者史料档案，公开检索、可溯可查。
            每一份档案都经审核发布、留痕存证——记其名，录其行，以史为鉴，警醒后人。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={() => setDrawerOpen(true)} className="btn-primary">
              汉奸定义标准
            </button>
            <Link to="/about" className="btn-ghost">
              编纂说明
            </Link>
          </div>
        </div>
      </section>
      {/* 综合检索 + 卡片墙 */}
      <section ref={wallRef} className="container-page pb-16">
        <form onSubmit={submitSearch} className="card mb-8 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label" htmlFor="f-name">姓名</label>
            <input
              id="f-name"
              className="input"
              placeholder="按姓名检索"
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="f-from">起始年份</label>
            <input
              id="f-from"
              className="input font-garamond"
              type="number"
              placeholder="如 1931"
              value={filters.yearFrom ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, yearFrom: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="f-to">截止年份</label>
            <input
              id="f-to"
              className="input font-garamond"
              type="number"
              placeholder="如 1949"
              value={filters.yearTo ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, yearTo: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="f-event">事件关键词</label>
            <input
              id="f-event"
              className="input"
              placeholder="如 投敌、伪政权"
              value={filters.event ?? ''}
              onChange={(e) => setFilters({ ...filters, event: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              检 索
            </button>
          </div>
        </form>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pickPeriod(undefined)}
              className={`badge cursor-pointer ${
                !filters.period ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight' : 'border-paperedge/25 text-paperdim'
              }`}
            >
              全部时期
            </button>
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pickPeriod(p)}
                className={`badge cursor-pointer ${
                  filters.period === p
                    ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                    : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? '检索中…' : `共 ${items.length} 条档案`}
          </span>
        </div>

        {filters.period && (
          <p className="mb-6 rounded-sm border border-bronze/30 bg-bronze/10 px-4 py-3 text-sm text-paperdim">
            <span className="mr-3 font-garamond text-bronzelight">{PERIOD_META[filters.period].range}</span>
            {PERIOD_META[filters.period].desc}
          </p>
        )}

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-paperdim">暂无符合条件的档案</p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((t) => (
            <TraitorCard key={t.id} traitor={t} />
          ))}
        </div>
      </section>

            {/* 统计看板 */}
      <section className="container-page -mt-1 py-14">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="汉奸总数" value={stats?.total ?? 0} />
          <StatCard label="被判刑总数" value={stats?.sentenced ?? 0} />
          <StatCard label="子女信息数" value={stats?.childrenInfo ?? 0} />
          <StatCard label="后代现状数" value={stats?.descendantsStatus ?? 0} />
        </div>
      </section>

      <DefinitionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
