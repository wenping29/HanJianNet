import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { TimelineNode } from '../types'

export default function EventTimeline() {
  const [timeline, setTimeline] = useState<TimelineNode[]>([])
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
        setTimeline(d.items)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : '加载失败')
        setTimeline([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

      {/* 时间线主体 */}
      <section className="container-page py-16">
        {loading && (
          <p className="py-16 text-center text-paperdim">加载中…</p>
        )}
        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}
        {!loading && !error && timeline.length === 0 && (
          <p className="py-16 text-center text-paperdim">暂无事件记录</p>
        )}

        {timeline.length > 0 && (
          <div className="relative mt-6">
            <div className="absolute left-4 top-0 h-full w-px bg-cinnabar/40 md:left-1/2" />
            <ul className="space-y-10">
              {timeline.map((node, i) => (
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
