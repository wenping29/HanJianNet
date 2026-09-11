import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import TraitorSnapshot from '../components/TraitorSnapshot'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { ReviewStatus, Revision, TraitorSnapshot as Snapshot } from '../types'

const SCALARS = [
  'name',
  'courtesyName',
  'pseudonym',
  'birthYear',
  'deathYear',
  'birthYearType',
  'deathYearType',
  'nativePlace',
  'period',
  'faction',
  'summary',
] as const

function computeChanged(oldSnap: Snapshot | null, next: Snapshot): Set<string> {
  if (!oldSnap) return new Set()
  const changed = new Set<string>()
  for (const k of SCALARS) {
    if ((oldSnap[k] ?? '') !== (next[k] ?? '')) changed.add(k)
  }
  if (oldSnap.aliases.join('|') !== next.aliases.join('|')) changed.add('aliases')
  if (oldSnap.identityTags.join('|') !== next.identityTags.join('|')) changed.add('identityTags')
  return changed
}

export default function ReviewDetail() {
  const { t } = useTranslation()
  const { rid } = useParams<{ rid: string }>()
  const [revision, setRevision] = useState<Revision | null>(null)
  const [current, setCurrent] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!rid) return
    setRevision(null)
    setCurrent(null)
    setError('')
    api
      .adminRevision(rid)
      .then(async (data) => {
        setRevision(data.revision)
        if (data.revision.traitorId) {
          try {
            const cur = await api.getTraitor(data.revision.traitorId)
            setCurrent(cur.traitor)
          } catch {
            setCurrent(null)
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
  }, [rid, t])

  const changedFields = useMemo(
    () => (revision ? computeChanged(current, revision.payload) : new Set<string>()),
    [revision, current],
  )

  async function review(result: 'approved' | 'rejected') {
    if (!rid || !revision) return
    setBusy(true)
    setActionError('')
    try {
      const data = await api.review(rid, { result, comment: comment.trim() || undefined })
      setRevision(data.revision)
      setComment('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.operationFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (error)
    return (
      <div className="container-page py-24 text-center">
        <p className="text-cinnabarlight">{error}</p>
        <Link to="/reviews" className="btn-ghost mt-6">{t('reviews.returnToQueue')}</Link>
      </div>
    )
  if (!revision) return <div className="container-page py-24 text-center text-paperdim">{t('common.loading')}</div>

  const isNew = !revision.traitorId
  const pending = revision.status === ('pending' satisfies ReviewStatus)

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/reviews" className="btn-ghost !px-3 !py-1.5 text-xs">{t('reviews.queue')}</Link>
          <span className={`badge ${isNew ? 'border-cinnabar/70 bg-cinnabar/15 text-cinnabarlight' : 'border-paperedge/30 text-paperdim'}`}>
            {isNew ? t('reviews.newArchive') : t('reviews.editArchive')}
          </span>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-paper">{revision.payload.name}</h1>
          <StatusBadge status={revision.status} />
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="inline text-paperdim">{t('reviews.submitter')}</dt><dd className="inline text-paper/90">{revision.submitter?.username ?? revision.submitterId}</dd></div>
          <div><dt className="inline text-paperdim">{t('reviews.modifier')}</dt><dd className="inline font-garamond text-paper/90">{formatDateTime(revision.submittedAt)}</dd></div>
          <div><dt className="inline text-paperdim">{t('reviews.reviewer')}</dt><dd className="inline text-paper/90">{revision.reviewer?.username ?? '—'}</dd></div>
          <div><dt className="inline text-paperdim">{t('reviews.reviewDate')}</dt><dd className="inline font-garamond text-paper/90">{formatDateTime(revision.reviewedAt)}</dd></div>
        </dl>
        <p className="mt-3 rounded-sm border border-bronze/40 bg-bronze/10 px-3 py-2 text-sm leading-relaxed text-bronzelight">
          <span className="mr-2 badge border-bronze/60 bg-bronze/15 text-bronzelight">{t('reviews.changeContent')}</span>
          {revision.changeSummary}
        </p>
        {!pending && (
          <p className={`mt-3 rounded-sm px-3 py-2 text-sm ${revision.reviewResult === 'approved' ? 'border border-bamboo/60 bg-bamboo/15 text-bamboolight' : 'border border-cinnabar/50 bg-cinnabar/10 text-cinnabarlight'}`}>
            {t('reviews.reviewResult')}{revision.reviewResult === 'approved' ? t('reviews.approved') : t('reviews.rejected')}
            {revision.reviewComment ? ` · ${t('reviews.reviewComment')}${revision.reviewComment}` : ''}
          </p>
        )}
      </header>

      <div className={`mt-6 grid grid-cols-1 gap-6 ${isNew ? '' : 'lg:grid-cols-2'}`}>
        {!isNew && (
          <section className="card animate-fade-up p-6">
            <h2 className="section-title mb-5">
              <span className="text-lg font-semibold tracking-[0.25em] text-paper">{t('reviews.currentPublished')}</span>
              <span className="font-garamond text-xs italic text-bronzelight">PUBLISHED</span>
            </h2>
            {current ? (
              <TraitorSnapshot data={current} />
            ) : (
              <p className="text-sm text-paperdim/60">{t('reviews.currentVersionLoadFailed')}</p>
            )}
          </section>
        )}

        <section className="card animate-fade-up p-6">
          <h2 className="section-title mb-5">
            <span className="text-lg font-semibold tracking-[0.25em] text-paper">{isNew ? t('reviews.newContent') : t('reviews.newVersion')}</span>
            <span className="font-garamond text-xs italic text-bronzelight">SUBMITTED</span>
          </h2>
          <TraitorSnapshot data={revision.payload} changedFields={changedFields} />
        </section>
      </div>

      {pending && (
        <section className="card animate-fade-up mt-6 p-6">
          <h2 className="section-title mb-5">
            <span className="text-lg font-semibold tracking-[0.25em] text-paper">{t('reviews.reviewAction')}</span>
            <span className="font-garamond text-xs italic text-bronzelight">REVIEW</span>
          </h2>
          <label className="label" htmlFor="comment">{t('reviews.reviewCommentPlaceholder')}</label>
          <textarea
            id="comment"
            className="input min-h-24 resize-y"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('reviews.reviewCommentHint')}
          />
          {actionError && (
            <p className="mt-3 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{actionError}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn-bamboo" disabled={busy} onClick={() => review('approved')}>
              {t('reviews.approveAndPublish')}
            </button>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => review('rejected')}>
              {t('reviews.reject')}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
