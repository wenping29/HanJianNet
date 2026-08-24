import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { findHistoryEvent, HISTORY_EVENTS } from '../lib/historyEvents'
import type { TraitorSummary } from '../types'

export default function HistoryEventDetail() {
  const { id } = useParams<{ id: string }>()
  const event = id ? findHistoryEvent(id) : undefined

  const [traitors, setTraitors] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!event) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    // 对每个关键词并行检索，按 period 收窄，合并去重
    const filters: TraitorFilters = { period: event.period }
    const tasks = event.keywords.map((kw) =>
      api.listTraitors({ ...filters, event: kw }).then((r) => r.items).catch(() => [] as TraitorSummary[]),
    )

    Promise.all(tasks).then((groups) => {
      if (cancelled) return
      const seen = new Map<string, TraitorSummary>()
      for (const list of groups) {
        for (const t of list) seen.set(t.id, t)
      }
      setTraitors([...seen.values()])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [event])

  // 相关事件（同期其他事件）
  const relatedEvents = useMemo(() => {
    if (!event) return []
    return HISTORY_EVENTS.filter((e) => e.id !== event.id && e.era === event.era).slice(0, 4)
  }, [event])

  if (!event) {
    return (
      <section className="container-page py-24 text-center">
        <p className="text-paperdim">未找到该历史事件。</p>
        <Link to="/events" className="mt-6 inline-block text-bronzelight underline underline-offset-4">
          返回历史事件列表 →
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
            <span className="font-garamond text-4xl font-semibold text-cinnabarlight">{event.year}</span>
            <span className="badge border-bronze/40 text-bronzelight">{event.era}</span>
          </div>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            {event.title}
          </h1>
          {event.alias && event.alias !== event.title && (
            <p className="mt-3 text-sm tracking-widest text-paperdim/70">又称：{event.alias}</p>
          )}
          <p className="mt-6 max-w-3xl leading-loose text-paperdim">{event.desc}</p>
        </div>
      </section>

      {/* 涉及汉奸 */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-baseline justify-between gap-3">
          <h2 className="section-title">
            <span className="text-xl font-semibold tracking-[0.25em] text-paper">涉及汉奸</span>
            <span className="font-garamond text-xs italic text-bronzelight">RELATED TRAITORS</span>
          </h2>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? '检索中…' : `共 ${traitors.length} 人`}
          </span>
        </div>

        {loading && <p className="py-16 text-center text-paperdim">加载中…</p>}

        {!loading && traitors.length === 0 && (
          <p className="py-16 text-center text-paperdim">暂无与该事件关联的汉奸档案</p>
        )}

        {!loading && traitors.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {traitors.map((t) => (
              <TraitorCard key={t.id} traitor={t} />
            ))}
          </div>
        )}
      </section>

      {/* 同期相关事件 */}
      {relatedEvents.length > 0 && (
        <section className="border-t border-paperedge/10 bg-inksoft/40 py-16">
          <div className="container-page">
            <h2 className="section-title">
              <span className="text-xl font-semibold tracking-[0.25em] text-paper">同期事件</span>
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
                    <span className="font-garamond text-2xl font-semibold text-cinnabarlight">{ev.year}</span>
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
