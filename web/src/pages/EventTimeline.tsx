import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { TimelineNode } from '../types'

interface EraDef {
  label: string
  range: string
  desc: string
  from?: number
  to?: number
}

// 时光轴时期定义（按年份区间前端过滤）
const ERAS: EraDef[] = [
  { label: '全部', range: '不限', desc: '依年序铺陈所有已收录的重大变节事件。' },
  { label: '唐末', range: '874 — 979', desc: '唐末五代之际，出仕异族或献城降敌者。', from: 874, to: 979 },
  { label: '宋末', range: '1234 — 1279', desc: '宋元鼎革之际，出仕蒙元或献城降敌者。', from: 1234, to: 1279 },
  { label: '明末', range: '1616 — 1662', desc: '明清易代之际，降清仕清、助清剿明者。', from: 1616, to: 1662 },
  { label: '清末', range: '1840 — 1912', desc: '列强侵凌之世，勾结外敌、出卖利权者。', from: 1840, to: 1912 },
  { label: '抗日', range: '1931 — 1945', desc: '抗战时期，投靠日本侵略者、充任伪职者。', from: 1931, to: 1945 },
]

export default function EventTimeline() {
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
        setError(e instanceof Error ? e.message : '加载失败')
        setAllItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeDef = ERAS.find((e) => e.label === activeEra) ?? ERAS[0]

  const items = useMemo(() => {
    if (!activeDef.from || !activeDef.to) return allItems
    return allItems.filter((n) => n.year !== null && n.year >= activeDef.from! && n.year <= activeDef.to!)
  }, [allItems, activeDef])

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TIMELINE OF EVENTS</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            事件时光轴
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            依年序铺陈近代重大变节事件，循时间脉络逐一对照人物与行迹。
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
                {era.label}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? '检索中…' : `共 ${items.length} 条事件`}
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
        {loading && <p className="py-16 text-center text-paperdim">加载中…</p>}
        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-paperdim">该时期暂无事件记录</p>
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
                      {node.year ?? '不详'}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-paper/90">{node.event}</p>
                    {node.traitorId && (
                      <Link
                        to={`/traitor/${node.traitorId}`}
                        className="mt-2 inline-block text-xs tracking-widest text-bronzelight underline underline-offset-4 hover:text-paper"
                      >
                        {node.traitorName ?? '查看档案'} →
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
