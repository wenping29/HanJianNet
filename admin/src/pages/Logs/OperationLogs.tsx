import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { ROLE_LABELS } from '../../lib/roles'
import type { OperationLogItem } from '../../types'
import {
  ClientSourceTag,
  MethodBadge,
  NoticeAndError,
  PAGE_SIZE,
  Pagination,
  SearchField,
  SectionTitle,
  StatusBadge,
  formatTime,
} from './_shared'

interface Filters {
  keyword: string
  username: string
  module: string
  action: string
  from: string
  to: string
}

const EMPTY: Filters = { keyword: '', username: '', module: '', action: '', from: '', to: '' }

export default function OperationLogs() {
  const { t } = useTranslation()
  const [items, setItems] = useState<OperationLogItem[]>([])
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
      const res = await api.operationLogs({
        keyword: f.keyword.trim() || undefined,
        username: f.username.trim() || undefined,
        module: f.module.trim() || undefined,
        action: f.action.trim() || undefined,
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
      <SectionTitle zh={t('logs.operationLogs.title')} en="Operation Audits" />

      <form
        className="animate-fade-up card mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        onSubmit={onSubmit}
      >
        <SearchField label={t('logs.operationLogs.keywordHint')}>
          <input
            className="input"
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder={t('logs.operationLogs.keywordPlaceholder')}
          />
        </SearchField>
        <SearchField label={t('common.username')}>
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </SearchField>
        <SearchField label={t('logs.operationLogs.module')}>
          <input
            className="input"
            value={form.module}
            onChange={(e) => setForm({ ...form, module: e.target.value })}
            placeholder={t('logs.operationLogs.modulePlaceholder')}
          />
        </SearchField>
        <SearchField label={t('logs.operationLogs.action')}>
          <input
            className="input"
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
            placeholder={t('logs.operationLogs.actionPlaceholder')}
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
            {loading ? t('logs.operationLogs.querying') : t('logs.operationLogs.query')}
          </button>
        </div>
      </form>

      <NoticeAndError error={error} />

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('logs.operationLogs.noData')}</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">{t('common.time')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.user')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.operationLogs.module')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.operationLogs.action')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.operationLogs.target')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.loginLogs.result')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.operationLogs.duration')}</th>
                  <th className="px-5 py-3 font-medium">{t('logs.operationLogs.path')}</th>
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
                        <td className="px-5 py-3">
                          <div className="leading-tight">
                            <div className="font-medium text-paper">{l.username || t('common.guest')}</div>
                            <div className="font-garamond text-xs text-paperdim/70">
                              {l.role ? (ROLE_LABELS[l.role as keyof typeof ROLE_LABELS] ?? l.role) : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="badge border-sky-500/40 bg-sky-500/10 text-sky-300">
                            {l.module || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="badge border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300">
                            {l.action || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-[220px]">
                          <div className="text-paper truncate" title={l.targetLabel ?? ''}>
                            {l.targetLabel || '—'}
                          </div>
                          {l.targetId && (
                            <div className="font-garamond text-xs text-paperdim/70 truncate" title={l.targetId}>
                              id: {l.targetId}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={l.status} />
                            <span className="font-garamond text-xs text-paperdim">HTTP {l.statusCode}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-garamond text-xs text-bronzelight whitespace-nowrap">
                          {l.elapsedMs} ms
                        </td>
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
                          <td colSpan={10} className="px-5 py-4">
                            <dl className="grid gap-3 text-sm md:grid-cols-2">
                              <div>
                                <dt className="text-xs tracking-widest text-paperdim">{t('common.message')}</dt>
                                <dd className="mt-1 text-paper whitespace-pre-wrap break-words">
                                  {l.message || '—'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs tracking-widest text-paperdim">User-Agent</dt>
                                <dd className="mt-1 font-garamond text-xs text-paperdim break-words">
                                  {l.userAgent || '—'}
                                </dd>
                              </div>
                              <div className="md:col-span-2">
                                <dt className="text-xs tracking-widest text-paperdim">{t('logs.errorLogs.requestBody')}</dt>
                                <dd className="mt-1">
                                  <pre className="max-h-60 overflow-auto rounded-sm border border-paperedge/20 bg-black/30 p-3 text-xs text-paperdim/90 whitespace-pre-wrap break-words">
                                    {l.requestBody || '—'}
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
          <Pagination total={total} page={page} totalPages={totalPages} loading={loading} label={t('logs.operationLogs.label')} onGo={goPage} />
        </>
      )}
    </div>
  )
}
