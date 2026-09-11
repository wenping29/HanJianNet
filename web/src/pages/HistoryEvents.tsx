import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAllHistoryEvents, HISTORY_ERAS } from '../lib/historyEvents'
import type { HistoryEvent } from '../lib/historyEvents'
import { eraLabel } from '../lib/format'
import { containerPageStyle } from '../style'

export default function HistoryEvents() {
  const { t } = useTranslation()
  const [activeEra, setActiveEra] = useState<string>('全部')
  const [items, setItems] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
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
            <span className="text-xs tracking-wider text-paperdim/70">{t('common.totalEvents', { count: items.length })}</span>
          </div>
        </div>

        {/* 事件卡片 */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {items.map((ev) => (
            <Link
              key={ev.id}
              to={`/events/${ev.id}`}
              className="card animate-fade-up group flex flex-col p-6 transition hover:-translate-y-1 hover:border-bronze/50"
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-paperedge/10 pb-3">
                <div className="flex items-baseline gap-3">
                  <span className="font-garamond text-3xl font-semibold text-cinnabarlight">{ev.year ?? t('common.unknownYear')}</span>
                  <h2 className="font-song text-xl font-bold tracking-wide text-paper group-hover:text-cinnabarlight">
                    {ev.title}
                  </h2>
                </div>
                <span className="badge border-bronze/40 text-bronzelight">{eraLabel(ev.era, t)}</span>
              </div>
              {ev.alias && ev.alias !== ev.title && (
                <p className="mt-2 text-xs tracking-widest text-paperdim/70">{t('events.alias')}{ev.alias}</p>
              )}
              <p className="mt-3 flex-1 text-sm leading-loose text-paper/85">{ev.desc}</p>
              <p className="mt-4 text-xs tracking-widest text-bronzelight opacity-70 transition group-hover:opacity-100">
                {t('events.viewTraitors')}
              </p>
            </Link>
          ))}
        </div>

        {loading && <p className="py-16 text-center text-paperdim">{t('common.loading')}</p>}

        {!loading && items.length === 0 && (
          <p className="py-16 text-center text-paperdim">{t('events.noEvents')}</p>
        )}
      </section>
    </div>
  )
}