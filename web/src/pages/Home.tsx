import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DefinitionDrawer from '../components/DefinitionDrawer'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { PERIODS, PERIOD_META, periodLabel } from '../lib/format'
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

const PAGE_SIZE = 20
const EMPTY_FILTERS: TraitorFilters = { name: '', yearFrom: undefined, yearTo: undefined, event: '', period: undefined }

/** 生成分页按钮上显示的页码列表：首尾页 + 当前页附近 + 省略号 */
function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 1) return [1]
  const windows: Array<number | '...'> = []
  const addRange = (from: number, to: number) => {
    for (let i = from; i <= to; i++) windows.push(i)
  }
  const delta = 2
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  windows.push(1)
  if (left > 2) windows.push('...')
  addRange(left, right)
  if (right < total - 1) windows.push('...')
  if (total > 1) windows.push(total)

  return windows
}

export default function Home() {
  const { t } = useTranslation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stats, setStats] = useState<TraitorStats | null>(null)
  const [filters, setFilters] = useState<TraitorFilters>(EMPTY_FILTERS)
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const wallRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadList = useCallback(async (f: TraitorFilters, p: number) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listTraitors({ ...f, page: p, pageSize: PAGE_SIZE })
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadList(EMPTY_FILTERS, 1)
    api.getStats().then(setStats).catch(() => setStats(null))
  }, [loadList])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadList(filters, 1)
    wallRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function pickPeriod(period?: string) {
    const next = { ...filters, period: period as TraitorFilters['period'] }
    setFilters(next)
    setPage(1)
    loadList(next, 1)
  }

  function gotoPage(p: number) {
    const target = Math.min(Math.max(1, p), totalPages)
    setPage(target)
    loadList(filters, target)
    wallRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages])

  return (
    <div>
      {/* 英雄区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-24 text-center md:py-32">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">HANJIAN HISTORICAL ARCHIVES</p>
          <h1 className="mt-5 max-w-3xl font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            {t('home.heroText')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={() => setDrawerOpen(true)} className="btn-primary">
              {t('home.definitionBtn')}
            </button>
            <Link to="/about" className="btn-ghost">
              {t('home.aboutBtn')}
            </Link>
          </div>
        </div>
      </section>
                  {/* 统计看板 */}
      <section className="container-page -mt-2 py-2">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('home.statTotal')} value={stats?.total ?? 0} />
          <StatCard label={t('home.statConvicted')} value={stats?.sentenced ?? 0} />
          <StatCard label={t('home.statChildren')} value={stats?.childrenInfo ?? 0} />
          <StatCard label={t('home.statDescendants')} value={stats?.descendantsStatus ?? 0} />
        </div>
      </section>
      {/* 综合检索 + 卡片墙 */}
      <section ref={wallRef} className="container-page pb-1">
        <form onSubmit={submitSearch} className="card mb-8 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label" htmlFor="f-name">{t('home.searchBy')}</label>
            <input
              id="f-name"
              className="input"
              placeholder={t('home.searchPlaceholder')}
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="f-from">{t('home.startYear')}</label>
            <input
              id="f-from"
              className="input font-garamond"
              type="number"
              placeholder={t('home.startYearPlaceholder')}
              value={filters.yearFrom ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, yearFrom: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="f-to">{t('home.endYear')}</label>
            <input
              id="f-to"
              className="input font-garamond"
              type="number"
              placeholder={t('home.endYearPlaceholder')}
              value={filters.yearTo ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, yearTo: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="f-event">{t('home.eventKeyword')}</label>
            <input
              id="f-event"
              className="input"
              placeholder={t('home.eventKeywordPlaceholder')}
              value={filters.event ?? ''}
              onChange={(e) => setFilters({ ...filters, event: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              {t('home.searchBtn')}
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
              {t('home.allPeriods')}
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
                {periodLabel(p, t)}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? t('home.searching') : t('home.totalResults', { total, page, totalPages })}
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
          <p className="py-16 text-center text-paperdim">{t('home.noResults')}</p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((t) => (
            <TraitorCard key={t.id} traitor={t} />
          ))}
        </div>

        {/* 分页控件 */}
        {!loading && !error && totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap" aria-label={t('common.pagination')}>
            <button
              type="button"
              onClick={() => gotoPage(page - 1)}
              disabled={page <= 1}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('common.prevPage')}
            </button>

            {pageList.map((p, idx) =>
              p === '...' ? (
                <span key={`e${idx}`} className="px-2 text-sm text-paperdim/60">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => gotoPage(p)}
                  className={`min-w-[36px] rounded-sm border px-2 py-1.5 text-sm transition ${
                    p === page
                      ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight shadow-seal'
                      : 'border-paperedge/25 text-paperdim hover:border-bronzelight hover:text-paper'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => gotoPage(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('common.nextPage')}
            </button>
          </nav>
        )}
      </section>



      <DefinitionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
