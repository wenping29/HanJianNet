import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { TimelineNode } from '../types'
import { containerPageStyle } from '../style'
import { ERAS } from '../lib/format'
export { ERAS } from '../lib/format'

export default function EventTimeline() {
  const { t } = useTranslation()
  const [allItems, setAllItems] = useState<TimelineNode[]>([])
  const [activeEra, setActiveEra] = useState<string>('全部')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api
      .getTimeline()
      .then((d) => {
        if (cancelled) return
        setAllItems(d.items)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : t('common.loadFailed'))
        setAllItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [t])

  const activeDef = ERAS.find((e) => e.label === activeEra) ?? ERAS[0]

  const items = useMemo(() => {
    if (!activeDef.from || !activeDef.to) return allItems
    return allItems.filter((n) => n.year !== null && n.year >= activeDef.from! && n.year <= activeDef.to!)
  }, [allItems, activeDef])

  const eraLabelMap: Record<string, string> = {
    '全部': 'era.all',
    '宋末': 'era.lateSong',
    '明末': 'era.lateMing',
    '清末': 'era.lateQing',
    '民国': 'era.republic',
    '抗日战争时期': 'era.warOfResistance',
    '其他': 'era.other',
  }

  function translateEra(label: string): string {
    const key = eraLabelMap[label]
    return key ? t(key) : label
  }

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TIMELINE OF EVENTS</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            {t('timeline.title')}
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            {t('timeline.heroText')}
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* 时期切换 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {ERAS.map((era) => (
              <button
                key={era.label}
                type="button"
                onClick={() => setActiveEra(era.label)}
                className={`badge cursor-pointer ${
                  activeEra === era.label
                    ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                    : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
                }`}
              >
                {translateEra(era.label)}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? t('timeline.searching') : t('common.totalEvents', { count: items.length })}
          </span>
        </div>

        {/* 当前时期说明 */}
        {activeEra !== '全部' && (
          <p className="mb-8 rounded-sm border border-bronze/30 bg-bronze/10 px-4 py-3 text-sm text-paperdim">
            <span className="mr-3 font-garamond text-bronzelight">{activeDef.range}</span>
            {activeDef.desc}
          </p>
        )}

        {/* 状态提示 */}
        {loading && <p className="py-16 text-center text-paperdim">{t('common.loading')}</p>}
        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-paperdim">{t('timeline.noEvents')}</p>
        )}

        {/* 时间线主体 */}
        {items.length > 0 && (
          <div className="relative mt-6">
            <div className="absolute left-4 top-0 h-full w-px bg-cinnabar/40 md:left-1/2" />
            <ul className="space-y-10">
              {items.map((node, i) => (
                <li
                  key={node.id}
                  className={`relative pl-12 md:w-1/2 md:pl-0 ${i % 2 === 0 ? 'md:pr-12' : 'md:ml-auto md:pl-12'}`}
                >
                  <span
                    className={`absolute top-1.5 h-3 w-3 rounded-full border-2 border-cinnabar bg-ink left-2.5 ${
                      i % 2 === 0 ? 'md:-right-1.5 md:left-auto' : 'md:-left-1.5'
                    }`}
                  />
                  <div className="card animate-fade-up p-5">
                    <p className="font-garamond text-lg font-semibold text-cinnabarlight">
                      {node.year ?? t('format.unknown')}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-paper/90">{node.event}</p>
                    {node.traitorId && (
                      <Link
                        to={`/traitor/${node.traitorId}`}
                        className="mt-2 inline-block text-xs tracking-widest text-bronzelight underline underline-offset-4 hover:text-paper"
                      >
                        {node.traitorName ?? t('timeline.viewArchive')} →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
