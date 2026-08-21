import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { ReviewStatus, Revision } from '../types'

const TABS: Array<{ key: ReviewStatus | 'all'; label: string }> = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'all', label: '全部' },
]

export default function Reviews() {
  const [tab, setTab] = useState<ReviewStatus | 'all'>('pending')
  const [items, setItems] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    api
      .adminRevisions(tab === 'all' ? undefined : tab)
      .then((data) => {
        if (alive) setItems(data.items)
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : '加载失败')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tab])

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">待审队列</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Review Queue</p>
        </div>
        <nav className="flex gap-1 rounded-sm border border-paperedge/20 bg-inkcard p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-sm px-4 py-1.5 text-sm tracking-widest transition ${
                tab === t.key ? 'bg-cinnabar/85 text-paper' : 'text-paperdim hover:text-paper'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无记录</p>
          <p className="mt-2 font-garamond text-xs italic text-paperdim/50">Nothing awaiting review here.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="animate-fade-up">
              <Link
                to={`/reviews/${r.id}`}
                className="card block p-5 transition hover:border-bronzelight/40 hover:shadow-seal"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={`badge ${r.traitorId ? 'border-paperedge/30 text-paperdim' : 'border-cinnabar/70 bg-cinnabar/15 text-cinnabarlight'}`}>
                    {r.traitorId ? '修改档案' : '新建档案'}
                  </span>
                  <h2 className="text-lg font-semibold tracking-widest text-paper">{r.payload.name}</h2>
                  <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{r.payload.period || '—'}</span>
                  <StatusBadge status={r.status} />
                  <span className="ml-auto font-garamond text-xs text-paperdim/70">{formatDateTime(r.submittedAt)}</span>
                </div>
                <p className="mt-2 truncate text-sm text-paperdim">
                  提交人：{r.submitter?.username ?? r.submitterId} · 摘要：{r.changeSummary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
