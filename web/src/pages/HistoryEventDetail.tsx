import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { findHistoryEvent, getAllHistoryEvents } from '../lib/historyEvents'
import type { HistoryEvent } from '../lib/historyEvents'
import { eraLabel } from '../lib/format'
import type { TraitorSummary } from '../types'

export default function HistoryEventDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const [event, setEvent] = useState<HistoryEvent | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [traitors, setTraitors] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [relatedEvents, setRelatedEvents] = useState<HistoryEvent[]>([])

  useEffect(() => {
    if (!id) {
      setLoadingEvent(false)
      return
    }
    let cancelled = false
    setLoadingEvent(true)
    setTraitors([])
    setEvent(null)

    Promise.all([findHistoryEvent(id), getAllHistoryEvents()]).then(([ev, all]) => {
      if (cancelled) return
      setEvent(ev)
      setRelatedEvents(
        ev ? all.filter((e) => e.id !== ev.id && e.era === ev.era).slice(0, 4) : [],
      )
      setLoadingEvent(false)
    }).catch(() => {
      if (cancelled) return
      setEvent(null)
      setLoadingEvent(false)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!event) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    const filters: TraitorFilters = { period: event.period }
    const tasks = event.keywords.map((kw) =>
      api.listTraitors({ ...filters, event: kw }).then((r) => r.items).catch(() => [] as TraitorSummary[]),
    )

    Promise.all(tasks).then((groups) => {
      if (cancelled) return
      const seen = new Map<string, TraitorSummary>()
      for (const list of groups) {
        for (const tr of list) seen.set(tr.id, tr)
      }
      setTraitors([...seen.values()])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [event])

  const persons = useMemo(() => event?.persons?.filter((p) => p.name.trim()).sort((a, b) => a.sort - b.sort) ?? [], [event])

  if (loadingEvent) {
    return (
      <section className="container-page py-24 text-center">
        <p className="text-paperdim">{t('common.loading')}</p>
      </section>
    )
  }

  if (!event) {
    return (
      <section className="container-page py-24 text-center">
        <p className="text-paperdim">{t('eventDetail.notFound')}</p>
        <Link to="/events" className="mt-6 inline-block text-bronzelight underline underline-offset-4">
          {t('eventDetail.backToList')}
        </Link>
      </section>
    )
  }

  return (
    <div>
      {/* 事件标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <div className="flex items-center gap-3">
            <span className="font-garamond text-4xl font-semibold text-cinnabarlight">{event.year ?? t('common.unknownYear')}</span>
            <span className="badge border-bronze/40 text-bronzelight">{eraLabel(event.era, t)}</span>
          </div>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            {event.title}
          </h1>
          {event.alias && event.alias !== event.title && (
            <p className="mt-3 text-sm tracking-widest text-paperdim/70">{t('eventDetail.alias')}{event.alias}</p>
          )}
          {event.location && (
            <p className="mt-2 text-sm tracking-widest text-paperdim/70">{t('eventDetail.location')}{event.location}</p>
          )}
          <p className="mt-6 max-w-3xl leading-loose text-paperdim">{event.desc}</p>
        </div>
      </section>

      {/* 涉案人员 */}
      {persons.length > 0 && (
        <section className="container-page py-16">
          <div className="mb-8 flex items-baseline justify-between gap-3">
            <h2 className="section-title">
              <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('eventDetail.personsTitle')}</span>
              <span className="font-garamond text-xs italic text-bronzelight">PERSONS INVOLVED</span>
            </h2>
            <span className="text-xs tracking-wider text-paperdim/70">
              {t('eventDetail.personsCount', { count: persons.length })}
              {typeof event.personCount === 'number' && event.personCount > persons.length
                ? ` / ${t('eventDetail.knownPersons', { count: event.personCount })}`
                : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {persons.map((p) => (
              <div key={p.id} className="card p-5">
                <p className="font-song text-lg font-bold tracking-wide text-paper">{p.name}</p>
                {(p.location || p.identityTags) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {p.location && (
                      <span className="badge border-paperedge/25 text-paperdim">{t('eventDetail.personLocation')}{p.location}</span>
                    )}
                    {p.identityTags && <span className="badge border-bronze/40 text-bronzelight">{p.identityTags}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 涉及汉奸 */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-baseline justify-between gap-3">
          <h2 className="section-title">
            <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('eventDetail.traitorsTitle')}</span>
            <span className="font-garamond text-xs italic text-bronzelight">RELATED TRAITORS</span>
          </h2>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? t('eventDetail.searching') : t('eventDetail.totalPeople', { count: traitors.length })}
          </span>
        </div>

        {loading && <p className="py-16 text-center text-paperdim">{t('common.loading')}</p>}

        {!loading && traitors.length === 0 && (
          <p className="py-16 text-center text-paperdim">{t('eventDetail.noTraitors')}</p>
        )}

        {!loading && traitors.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {traitors.map((tr) => (
              <TraitorCard key={tr.id} traitor={tr} />
            ))}
          </div>
        )}
      </section>

      {/* 同期相关事件 */}
      {relatedEvents.length > 0 && (
        <section className="border-t border-paperedge/10 bg-inksoft/40 py-16">
          <div className="container-page">
            <h2 className="section-title">
              <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('eventDetail.relatedEvents')}</span>
              <span className="font-garamond text-xs italic text-bronzelight">RELATED EVENTS</span>
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {relatedEvents.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/events/${ev.id}`}
                  className="card group flex flex-col p-5 transition hover:-translate-y-1 hover:border-bronze/50"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-garamond text-2xl font-semibold text-cinnabarlight">{ev.year ?? t('common.unknownYear')}</span>
                    <h3 className="font-song text-lg font-bold tracking-wide text-paper group-hover:text-cinnabarlight">
                      {ev.title}
                    </h3>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-paperdim">{ev.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}