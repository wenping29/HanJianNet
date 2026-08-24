import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { Revision } from '../types'

export default function TraitorHistory() {
  const { id } = useParams<{ id: string }>()
  const [items, setItems] = useState<Revision[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api
      .getRevisions(id)
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="section-title !border-l-cinnabar">
          <span className="text-xl font-semibold tracking-[0.25em] text-paper">修改历史</span>
          <span className="font-garamond text-xs italic text-bronzelight">REVISION HISTORY</span>
        </h1>
        <Link to={`/traitor/${id}`} className="btn-ghost !px-4 !py-2 text-xs">
          ← 返回档案
        </Link>
      </div>

      {loading && <p className="py-16 text-center text-paperdim">加载中…</p>}
      {error && (
        <p className="mt-8 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-paperdim">该档案暂无修改记录</p>
      )}

      <ol className="relative mt-10 space-y-6 border-l border-paperedge/20 pl-6">
        {items.map((r) => (
          <li key={r.id} className="relative card animate-fade-up p-5">
            <span className="absolute -left-[31px] top-6 h-2.5 w-2.5 rounded-full border-2 border-bronze bg-ink" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <StatusBadge status={r.status} />
              <span className="text-sm tracking-wider text-paper">
                修改人：<span className="text-bronzelight">{r.submitter?.username ?? r.submitterId}</span>
              </span>
              <span className="font-garamond text-xs text-paperdim">{formatDateTime(r.submittedAt)}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-paper/85">
              <span className="mr-2 badge border-paperedge/25 text-paperdim/80">修改内容</span>
              {r.changeSummary}
            </p>
            {(r.status === 'approved' || r.status === 'rejected') && (
              <p className="mt-3 text-xs leading-relaxed text-paperdim">
                审核人：{r.reviewer?.username ?? r.reviewerId ?? '—'}
                <span className="mx-2 font-garamond">{formatDateTime(r.reviewedAt)}</span>
                结果：
                <span className={r.status === 'approved' ? 'text-bamboolight' : 'text-cinnabarlight'}>
                  {r.status === 'approved' ? '通过' : '驳回'}
                </span>
                {r.reviewComment && <span className="ml-2">意见：{r.reviewComment}</span>}
              </p>
            )}
            {r.traitorId && (
              <Link
                to={`/traitor/${r.traitorId}`}
                className="mt-3 inline-block text-xs tracking-widest text-bronzelight underline underline-offset-4 hover:text-paper"
              >
                查看档案 →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
