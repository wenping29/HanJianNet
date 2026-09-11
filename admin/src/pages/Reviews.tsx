import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { ReviewStatus, Revision } from '../types'

export default function Reviews() {
  const { t } = useTranslation()
  const TABS: Array<{ key: ReviewStatus | 'all'; label: string }> = [
    { key: 'pending', label: t('reviews.pending') },
    { key: 'approved', label: t('reviews.approved') },
    { key: 'rejected', label: t('reviews.rejected') },
    { key: 'all', label: t('reviews.all') },
  ]
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
        if (alive) setError(e instanceof Error ? e.message : t('common.loadFailed'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [tab, t])

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('reviews.title')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Review Queue</p>
        </div>
        <nav className="flex gap-1 rounded-sm border border-paperedge/20 bg-inkcard p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              className={`rounded-sm px-4 py-1.5 text-sm tracking-widest transition ${
                tab === tb.key ? 'bg-cinnabar/85 text-paper' : 'text-paperdim hover:text-paper'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('reviews.noRecords')}</p>
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
                    {r.traitorId ? t('reviews.editArchive') : t('reviews.newArchive')}
                  </span>
                  <h2 className="text-lg font-semibold tracking-widest text-paper">{r.payload.name}</h2>
                  <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{r.payload.period || '—'}</span>
                  <StatusBadge status={r.status} />
                  <span className="ml-auto font-garamond text-xs text-paperdim/70">{formatDateTime(r.submittedAt)}</span>
                </div>
                <p className="mt-2 truncate text-sm text-paperdim">
                  {t('reviews.submitter')}{r.submitter?.username ?? r.submitterId} · {t('reviews.summary')}: {r.changeSummary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
