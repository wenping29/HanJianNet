import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useAuth } from '../stores/auth'
import type { Revision } from '../types'

export default function Profile() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const [items, setItems] = useState<Revision[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .mySubmissions()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-page max-w-5xl py-10">
      <h1 className="section-title">
        <span className="text-xl font-semibold tracking-[0.25em] text-paper">{t('profile.title')}</span>
        <span className="font-garamond text-xs italic text-bronzelight">MY SUBMISSIONS</span>
      </h1>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="text-sm text-paperdim">
          <span className="mr-4 tracking-widest text-paper">{user?.username}</span>
          <span>{user?.email}</span>
        </div>
        <Link to="/submit" className="btn-primary !px-4 !py-2 text-xs">
          {t('profile.newArchive')}
        </Link>
      </div>

      {loading && <p className="py-16 text-center text-paperdim">{t('common.loading')}</p>}
      {error && (
        <p className="mt-8 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-paperdim">{t('profile.noSubmissions')}</p>
      )}

      {items.length > 0 && (
        <div className="card mt-6 overflow-x-auto">
          <table className="table-old">
            <thead>
              <tr>
                <th>{t('profile.submitTime')}</th>
                <th>{t('profile.type')}</th>
                <th>{t('profile.changeSummary')}</th>
                <th>{t('profile.status')}</th>
                <th>{t('profile.reviewComment')}</th>
                <th>{t('profile.operation')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-garamond">{formatDateTime(r.submittedAt)}</td>
                  <td>{r.traitorId ? t('profile.editArchive') : t('profile.newArchiveLabel')}</td>
                  <td className="max-w-xs">{r.changeSummary}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[12rem] text-paperdim">{r.reviewComment || '—'}</td>
                  <td>
                    {r.traitorId ? (
                      <Link
                        to={`/traitor/${r.traitorId}`}
                        className="text-bronzelight underline underline-offset-4 hover:text-paper"
                      >
                        {t('profile.viewArchive')}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
