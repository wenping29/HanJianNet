import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import type { ContactMessage } from '../types'

const PAGE_SIZE = 10

type HandledFilter = '' | 'pending' | 'handled'

function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: Array<number | '…'> = []
  const push = (n: number | '…') => pages.push(n)
  push(1)
  if (page > 3) push('…')
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i += 1) push(i)
  if (page < totalPages - 2) push('…')
  push(totalPages)
  return pages
}

export default function ContactMessages() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ContactMessage[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [keyword, setKeyword] = useState('')
  const [handled, setHandled] = useState<HandledFilter>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busyId, setBusyId] = useState('')

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])
  const safePage = Math.min(page, pageCount)
  const pages = useMemo(() => pageWindow(safePage, pageCount), [safePage, pageCount])

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.contactMessages({
        keyword: keyword.trim() || undefined,
        handled: handled === '' ? undefined : handled === 'handled',
        page: safePage,
        pageSize: PAGE_SIZE,
      })
      setItems(Array.isArray(data.items) ? data.items : [])
      setTotal(data.total)
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
    }
  }, [keyword, handled, safePage, t])

  useEffect(() => {
    let alive = true
    setLoading(true)
    reload().finally(() => {
      if (alive) setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [reload])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const goPage = (next: number) => {
    if (next < 1 || next > pageCount || next === safePage) return
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function toggleHandled(m: ContactMessage) {
    setBusyId(m.id)
    setError('')
    try {
      await api.setContactMessageHandled(m.id, !m.isHandled)
      flash(!m.isHandled ? t('contactMessages.markedHandled') : t('contactMessages.markedPending'))
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'))
    } finally {
      setBusyId('')
    }
  }

  async function remove(m: ContactMessage) {
    if (!window.confirm(t('contactMessages.confirmDelete'))) return
    setBusyId(m.id)
    setError('')
    try {
      await api.deleteContactMessage(m.id)
      flash(t('contactMessages.deleted'))
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.deleteFailed'))
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="container-page py-5">
      <PageHeader title={t('contactMessages.title')} subtitle={t('contactMessages.subtitle')} />

      <div className="animate-fade-up mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <input
            className="input min-w-0 max-w-xs flex-1"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            placeholder={t('contactMessages.searchPlaceholder')}
          />
          <select
            className="input w-auto flex-none"
            value={handled}
            onChange={(e) => {
              setHandled(e.target.value as HandledFilter)
              setPage(1)
            }}
          >
            <option value="">{t('contactMessages.filterAll')}</option>
            <option value="pending">{t('contactMessages.filterPending')}</option>
            <option value="handled">{t('contactMessages.filterHandled')}</option>
          </select>
        </div>
      </div>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/60 bg-bronze/15 px-3 py-2 text-sm text-bronzelight">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : safePage > Math.max(1, totalPages) && page > 1 ? (
        <div className="card mt-6 flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('contactMessages.noMessages')}</p>
          <button type="button" className="btn-ghost" onClick={() => setPage(1)}>
            {t('common.returnToList')}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('contactMessages.noMessages')}</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">{t('contactMessages.col.status')}</th>
                  <th className="px-5 py-3 font-medium">{t('contactMessages.col.title')}</th>
                  <th className="px-5 py-3 font-medium">{t('contactMessages.col.sender')}</th>
                  <th className="px-5 py-3 font-medium">{t('contactMessages.col.time')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('contactMessages.col.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <FragmentRow
                    key={m.id}
                    m={m}
                    expanded={expanded === m.id}
                    onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
                    busy={busyId === m.id}
                    tFn={(key: string) => t(key)}
                    onToggleHandled={() => toggleHandled(m)}
                    onRemove={() => remove(m)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs tracking-widest text-paperdim/80">
              {t('common.totalRecords', { total, page: safePage, totalPages: pageCount })}
            </div>
            <nav className="flex flex-wrap items-center gap-1.5" aria-label={t('common.pagination')}>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => goPage(safePage - 1)}
                disabled={safePage <= 1}
              >
                {t('common.prevPage')}
              </button>
              {pages.map((n, i) =>
                n === '…' ? (
                  <span
                    key={`cm${i}`}
                    className="inline-flex h-8 w-8 items-center justify-center text-xs text-paperdim/50"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => goPage(n)}
                    className={`h-8 min-w-8 rounded-sm border px-2 text-xs transition ${
                      n === safePage
                        ? 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight shadow-seal'
                        : 'border-paperedge/20 text-paperdim hover:border-bronzelight hover:text-paper'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => goPage(safePage + 1)}
                disabled={safePage >= pageCount}
              >
                {t('common.nextPage')}
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

function FragmentRow({
  m,
  expanded,
  onToggle,
  busy,
  tFn,
  onToggleHandled,
  onRemove,
}: {
  m: ContactMessage
  expanded: boolean
  onToggle: () => void
  busy: boolean
  tFn: (key: string) => string
  onToggleHandled: () => void
  onRemove: () => void
}) {
  return (
    <>
      <tr className="border-b border-paperedge/10 hover:bg-inkcard/60">
        <td className="px-5 py-3">
          <span
            className={`inline-flex items-center rounded-sm border px-2 py-1 text-xs tracking-wider ${
              m.isHandled
                ? 'border-bamboo/60 bg-bamboo/15 text-bamboolight'
                : 'border-cinnabar/50 bg-cinnabar/10 text-cinnabarlight'
            }`}
          >
            {m.isHandled ? tFn('contactMessages.handled') : tFn('contactMessages.pending')}
          </span>
        </td>
        <td className="px-5 py-3">
          <button type="button" className="font-medium tracking-wider text-paper" onClick={onToggle}>
            {m.title}
          </button>
        </td>
        <td className="px-5 py-3 text-paperdim">{m.name}</td>
        <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">
          {new Date(m.createdAt).toLocaleString()}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center justify-end gap-2">
            {busy ? (
              <span className="text-xs text-paperdim">{tFn('common.loading')}</span>
            ) : (
              <>
                <button type="button" className="btn-bronze !px-3 !py-1.5 text-xs" onClick={onToggleHandled}>
                  {m.isHandled ? tFn('contactMessages.restore') : tFn('contactMessages.markHandled')}
                </button>
                <button type="button" className="btn-danger !px-3 !py-1.5 text-xs" onClick={onRemove}>
                  {tFn('common.delete')}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-paperedge/10 bg-inksoft/40">
          <td colSpan={5} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs tracking-widest text-paperdim/60">{tFn('contactMessages.detail.contact')}</p>
                <p className="mt-1 text-sm text-paper">{m.contact || '—'}</p>
              </div>
              <div>
                <p className="text-xs tracking-widest text-paperdim/60">{tFn('contactMessages.detail.ip')}</p>
                <p className="mt-1 font-garamond text-sm text-paper/80">{m.ip || '—'}</p>
              </div>
              {m.isHandled && m.handledAt && (
                <div>
                  <p className="text-xs tracking-widest text-paperdim/60">{tFn('contactMessages.detail.handledAt')}</p>
                  <p className="mt-1 font-garamond text-sm text-paper/80">
                    {new Date(m.handledAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs tracking-widest text-paperdim/60">{tFn('contactMessages.detail.content')}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-paper/90">{m.content}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}