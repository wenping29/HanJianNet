import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllHistoryEvents, HISTORY_ERAS } from '../lib/historyEvents'
import { containerPageStyle } from '../style'

export default function HistoryEvents() {
  const [activeEra, setActiveEra] = useState<string>('全部')
  const [refreshKey, setRefreshKey] = useState(0)

  const items = useMemo(() => {
    const all = getAllHistoryEvents()
    if (activeEra === '全部') return all
    return all.filter((e) => e.era === activeEra)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEra, refreshKey])

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">HISTORICAL EVENTS</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            历史事件
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            列举近代重大国难与变节事件，标其年月、记其本末——鉴往知来，勿忘国耻。
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
                {era}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/events/new" className="btn-bronze !px-4 !py-1.5 text-xs">
              + 新增事件
            </Link>
            <span className="text-xs tracking-wider text-paperdim/70">共 {items.length} 条事件</span>
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
                  <span className="font-garamond text-3xl font-semibold text-cinnabarlight">{ev.year}</span>
                  <h2 className="font-song text-xl font-bold tracking-wide text-paper group-hover:text-cinnabarlight">
                    {ev.title}
                  </h2>
                </div>
                <span className="badge border-bronze/40 text-bronzelight">{ev.era}</span>
              </div>
              {ev.alias && ev.alias !== ev.title && (
                <p className="mt-2 text-xs tracking-widest text-paperdim/70">又称：{ev.alias}</p>
              )}
              <p className="mt-3 flex-1 text-sm leading-loose text-paper/85">{ev.desc}</p>
              <p className="mt-4 text-xs tracking-widest text-bronzelight opacity-70 transition group-hover:opacity-100">
                查看涉及汉奸 →
              </p>
            </Link>
          ))}
        </div>

        {items.length === 0 && (
          <p className="py-16 text-center text-paperdim">该时期暂无事件记录</p>
        )}
      </section>
    </div>
  )
}
