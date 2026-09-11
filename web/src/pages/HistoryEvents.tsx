import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAllHistoryEvents, HISTORY_ERAS } from '../lib/historyEvents'
import type { HistoryEvent } from '../lib/historyEvents'
import { eraLabel } from '../lib/format'
import { containerPageStyle } from '../style'

const PAGE_SIZE = 20

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

export default function HistoryEvents() {
  const { t } = useTranslation()
  const [activeEra, setActiveEra] = useState<string>('全部')
  const [items, setItems] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setPage(1)
    getAllHistoryEvents(activeEra === '全部' ? undefined : activeEra)
      .then((list) => {
        if (cancelled) return
        setItems(list)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setItems([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeEra])

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  )
  const pageList = useMemo(() => buildPageList(safePage, totalPages), [safePage, totalPages])

  function gotoPage(p: number) {
    const target = Math.min(Math.max(1, p), totalPages)
    if (target === safePage) return
    setPage(target)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">HISTORICAL EVENTS</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            {t('events.title')}
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            {t('events.heroText')}
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* 时期切换 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {HISTORY_ERAS.map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => setActiveEra(era)}
                className={`badge cursor-pointer ${
                  activeEra === era
                    ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                    : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
                }`}
              >
                {era === '全部' ? t('events.all') : eraLabel(era, t)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/events/new" className="btn-bronze !px-4 !py-1.5 text-xs">
              {t('events.newEvent')}
            </Link>
          </div>
        </div>

        {/* 卡片顶部：总数 + 页码 */}
        <div ref={listRef} className="mt-8 flex flex-wrap items-baseline justify-between gap-2 scroll-mt-24">
          <p className="text-sm tracking-widest text-paperdim/80">
            {t('common.totalEvents', { count: total })}
          </p>
          {totalPages > 1 && (
            <p className="text-xs tracking-wider text-paperdim/60">
              {t('common.pageInfo', { page: safePage, totalPages })}
            </p>
          )}
        </div>

        {/* 事件卡片 */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((ev) => (
            <Link
              key={ev.id}
              to={`/events/${ev.id}`}
              className="card animate-fade-up group flex flex-col p-4 transition hover:-translate-y-1 hover:border-bronze/50"
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-paperedge/10 pb-2">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="font-garamond text-xl font-semibold text-cinnabarlight">{ev.year ?? t('common.unknownYear')}</span>
                  <h2 className="truncate font-song text-sm font-bold tracking-wide text-paper group-hover:text-cinnabarlight">
                    {ev.title}
                  </h2>
                </div>
                <span className="badge flex-none border-bronze/40 text-bronzelight">{eraLabel(ev.era, t)}</span>
              </div>
              {ev.alias && ev.alias !== ev.title && (
                <p className="mt-1.5 truncate text-[11px] tracking-widest text-paperdim/70">{t('events.alias')}{ev.alias}</p>
              )}
              <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-paper/85">{ev.desc}</p>
              <p className="mt-2 text-[11px] tracking-widest text-bronzelight opacity-70 transition group-hover:opacity-100">
                {t('events.viewTraitors')}
              </p>
            </Link>
          ))}
        </div>

        {loading && <p className="py-16 text-center text-paperdim">{t('common.loading')}</p>}

        {!loading && total === 0 && (
          <p className="py-16 text-center text-paperdim">{t('events.noEvents')}</p>
        )}

        {/* 分页控件 */}
        {!loading && totalPages > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label={t('common.pagination')}>
            <button
              type="button"
              onClick={() => gotoPage(safePage - 1)}
              disabled={safePage <= 1}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
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
                    p === safePage
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
              onClick={() => gotoPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('common.nextPage')}
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
