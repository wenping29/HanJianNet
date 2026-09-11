import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { ROLE_LABELS } from '../../lib/roles'
import type { ErrorLogItem } from '../../types'
import {
  ClientSourceTag,
  LevelBadge,
  MethodBadge,
  NoticeAndError,
  PAGE_SIZE,
  Pagination,
  SearchField,
  SectionTitle,
  formatTime,
} from './_shared'

interface Filters {
  keyword: string
  username: string
  level: string
  path: string
  from: string
  to: string
}

const EMPTY: Filters = { keyword: '', username: '', level: '', path: '', from: '', to: '' }

export default function ErrorLogs() {
  const { t } = useTranslation()
  const [items, setItems] = useState<ErrorLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [form, setForm] = useState<Filters>(EMPTY)
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const reload = useCallback(async (f: Filters, p = 1) => {
    setError('')
    try {
      const res = await api.errorLogs({
        keyword: f.keyword.trim() || undefined,
        username: f.username.trim() || undefined,
        level: f.level || undefined,
        path: f.path.trim() || undefined,
        from: f.from || undefined,
        to: f.to || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      })
      const list = Array.isArray(res.items) ? res.items : []
      setItems(list)
      setPage(typeof res.page === 'number' ? res.page : p)
      setTotal(typeof res.total === 'number' ? res.total : list.length)
      const pageSizeNum = typeof res.pageSize === 'number' ? res.pageSize : PAGE_SIZE
      setTotalPages(
        typeof res.totalPages === 'number'
          ? res.totalPages
          : Math.max(1, Math.ceil(list.length / Math.max(1, pageSizeNum))),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
    }
  }, [t])

  useEffect(() => {
    let alive = true
    setLoading(true)
    reload(filters, 1).finally(() => {
      if (alive) setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [filters, reload])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...form })
  }
  const onReset = () => {
    setForm(EMPTY)
    setFilters(EMPTY)
  }
  const goPage = async (n: number) => {
    if (n < 1 || n > totalPages || n === page || loading) return
    setLoading(true)
    await reload(filters, n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoading(false)
  }

  return (
    <div className="container-page py-10">
      <SectionTitle zh={t('logs.errorLogs.title')} en="Error Audits" />

      <form
        className="animate-fade-up card mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        onSubmit={onSubmit}
      >
        <SearchField label={t('logs.errorLogs.keywordHint')}>
          <input
            className="input"
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder={t('logs.errorLogs.keywordPlaceholder')}
          />
        </SearchField>
        <SearchField label={t('common.username')}>
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </SearchField>
        <SearchField label={t('logs.errorLogs.level')}>
          <select
            className="input"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
            <option value="">{t('common.all')}</option>
            <option value="warning">{t('logs.errorLogs.warning')}</option>
            <option value="error">{t('logs.errorLogs.errorLevel')}</option>
            <option value="critical">{t('logs.errorLogs.critical')}</option>
          </select>
        </SearchField>
        <SearchField label={t('logs.errorLogs.pathContains')}>
          <input
            className="input"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            placeholder="/api/..."
          />
        </SearchField>
        <SearchField label={t('common.startDate')}>
          <input
            type="date"
            className="input"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
          />
        </SearchField>
        <SearchField label={t('common.endDate')}>
          <input
            type="date"
            className="input"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
          />
        </SearchField>
        <div className="md:col-span-2 lg:col-span-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onReset}>{t('common.reset')}</button>
          <button type="submit" className="btn-bronze" disabled={loading}>
            {loading ? t('logs.errorLogs.querying') : t('logs.errorLogs.query')}
          </button>
        </div>
      </form>

      <NoticeAndError error={error} />

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('logs.errorLogs.noData')}</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">{t('common.time')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.errorLogs.level')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.errorLogs.exceptionType')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.user')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.message')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.errorLogs.statusCode')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.errorLogs.api')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.ip')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.origin')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => {
                  const expanded = expandedId === l.id
                  return (
                    <>
                      <tr
                        key={l.id}
                        className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60 cursor-pointer"
                        onClick={() => setExpandedId(expanded ? null : l.id)}
                      >
                        <td className="px-5 py-3 font-garamond text-xs text-paperdim/80 whitespace-nowrap">
                          {formatTime(l.createdAt)}
                        </td>
                        <td className="px-5 py-3"><LevelBadge level={l.level} /></td>
                        <td className="px-5 py-3">
                          <span className="font-medium tracking-wider text-rose-300">{l.exceptionType || '—'}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="leading-tight">
                            <div className="font-medium text-paper">{l.username || t('common.guest')}</div>
                            <div className="font-garamond text-xs text-paperdim/70">
                              {l.role ? (ROLE_LABELS[l.role as keyof typeof ROLE_LABELS] ?? l.role) : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 max-w-sm">
                          <div className="text-paper line-clamp-2" title={l.message}>
                            {l.message || '—'}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-garamond text-xs text-cinnabarlight">{l.statusCode}</td>
                        <td className="px-5 py-3 max-w-[260px]">
                          <div className="flex items-center gap-1.5">
                            <MethodBadge method={l.method} />
                            <span className="font-garamond text-xs text-paperdim truncate" title={l.path}>
                              {l.path}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-garamond text-xs text-paperdim whitespace-nowrap">
                          {l.ip || '—'}
                        </td>
                        <td className="px-5 py-3"><ClientSourceTag s={l.clientSource} /></td>
                      </tr>
                      {expanded && (
                        <tr key={`d-${l.id}`} className="border-b border-paperedge/10 bg-inkcard/70">
                          <td colSpan={9} className="px-5 py-4">
                            <dl className="grid gap-4 text-sm md:grid-cols-2">
                              <div className="md:col-span-2">
                                <dt className="text-xs tracking-widest text-paperdim">{t('logs.errorLogs.errorMessage')}</dt>
                                <dd className="mt-1 text-rose-200 whitespace-pre-wrap break-words">
                                  {l.message || '—'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs tracking-widest text-paperdim">Query</dt>
                                <dd className="mt-1">
                                  <pre className="max-h-40 overflow-auto rounded-sm border border-paperedge/20 bg-black/30 p-3 text-xs text-paperdim/90 break-all whitespace-pre-wrap">
                                    {l.query || '—'}
                                  </pre>
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs tracking-widest text-paperdim">{t('logs.errorLogs.requestBody')}</dt>
                                <dd className="mt-1">
                                  <pre className="max-h-40 overflow-auto rounded-sm border border-paperedge/20 bg-black/30 p-3 text-xs text-paperdim/90 break-all whitespace-pre-wrap">
                                    {l.requestBody || '—'}
                                  </pre>
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs tracking-widest text-paperdim">User-Agent</dt>
                                <dd className="mt-1 font-garamond text-xs text-paperdim break-words">
                                  {l.userAgent || '—'}
                                </dd>
                              </div>
                              <div className="md:col-span-2">
                                <dt className="text-xs tracking-widest text-paperdim">{t('logs.errorLogs.stack')}</dt>
                                <dd className="mt-1">
                                  <pre className="max-h-80 overflow-auto rounded-sm border border-rose-500/20 bg-black/40 p-3 text-xs text-rose-100/90 break-words whitespace-pre">
                                    {l.stackTrace || t('logs.errorLogs.noStack')}
                                  </pre>
                                </dd>
                              </div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} totalPages={totalPages} loading={loading} label={t('logs.errorLogs.label')} onGo={goPage} />
        </>
      )}
    </div>
  )
}
