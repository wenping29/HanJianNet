import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { formatLifeSpan, harmLevelClass, HARM_LEVELS } from '../lib/format'
import { toast } from '../components/Toast'
import Modal from '../components/Modal'
import { canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import { useConfig } from '../stores/config'
import type { TraitorSummary } from '../types'

const DEFAULT_PAGE_SIZE = 10

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

function csvQuote(value: string | number): string {
  const s = String(value ?? '').replace(/"/g, '""')
  return /[",\r\n]/.test(s) ? `"${s}"` : s
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildCsv(rows: TraitorSummary[], rowCsv: (r: TraitorSummary) => string): string {
  const header = ['姓名', '生年', '卒年', '时期', '派系', '籍贯', '身份标签', '危害等级', '照片地址']
  return [header.map(csvQuote).join(','), ...rows.map(rowCsv)].join('\n')
}

export default function Traitors() {
  const { t } = useTranslation()
  const me = useAuth((s) => s.user)!
  const navigate = useNavigate()
  const pageSize = useConfig((s) => s.getNumber('web.admin.traitors.pageSize', DEFAULT_PAGE_SIZE))
  const showAvatar = useConfig((s) => s.getBoolean('web.admin.traitors.showAvatar', true))
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState('')
  const [level, setLevel] = useState('')
  const [hasPhoto, setHasPhoto] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TraitorSummary | null>(null)
  const [photoDeletingId, setPhotoDeletingId] = useState<string | null>(null)
  const [pendingPhotoDelete, setPendingPhotoDelete] = useState<TraitorSummary | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingBatchDelete, setPendingBatchDelete] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [pendingBatchPhotoDelete, setPendingBatchPhotoDelete] = useState(false)
  const [batchPhotoDeleting, setBatchPhotoDeleting] = useState(false)
  const [batchExporting, setBatchExporting] = useState(false)
  const [levelUpdatingId, setLevelUpdatingId] = useState<string | null>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(async (name?: string, p = 1, lv?: number, hp?: boolean) => {
    setError('')
    try {
      const data = await api.adminTraitors(name || undefined, p, pageSize, lv, hp)
      const items = Array.isArray(data.items) ? data.items : []
      const pageNum = typeof data.page === 'number' ? data.page : p
      const totalNum = typeof data.total === 'number' ? data.total : items.length
      const pageSizeNum = typeof data.pageSize === 'number' ? data.pageSize : pageSize
      const totalPagesNum =
        typeof data.totalPages === 'number'
          ? data.totalPages
          : Math.max(1, Math.ceil(totalNum / Math.max(1, pageSizeNum)))
      setItems(items)
      setPage(pageNum)
      setTotal(totalNum)
      setTotalPages(totalPagesNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
    }
  }, [t, pageSize])

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

  const handleSearch = async () => {
    const q = keyword.trim()
    setSearched(q)
    setLoading(true)
    await reload(q, 1, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    setLoading(false)
  }

  const handleReset = async () => {
    setKeyword('')
    setSearched('')
    setLevel('')
    setHasPhoto('')
    setLoading(true)
    await reload(undefined, 1, undefined, undefined)
    setLoading(false)
  }

  const goPage = async (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    setLoading(true)
    await reload(searched || undefined, next, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoading(false)
  }

  const handleLevelChange = (v: string) => {
    setLevel(v)
    setLoading(true)
    void reload(searched || undefined, 1, v ? Number(v) : undefined, hasPhoto ? hasPhoto === '1' : undefined).finally(() => setLoading(false))
  }

  const handlePhotoChange = (v: string) => {
    setHasPhoto(v)
    setLoading(true)
    void reload(searched || undefined, 1, level ? Number(level) : undefined, v ? v === '1' : undefined).finally(() => setLoading(false))
  }

  const handleUpdateHarmLevel = async (tr: TraitorSummary, value: string) => {
    setLevelUpdatingId(tr.id)
    setError('')
    try {
      await api.updateTraitorHarmLevel(tr.id, value ? Number(value) : null)
      toast(t('traitors.harmLevelUpdated'))
      await reload(searched || undefined, page, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.harmLevelUpdateFailed'), 'error')
    } finally {
      setLevelUpdatingId(null)
    }
  }

  const handleDelete = async (tr: TraitorSummary) => {
    setDeletingId(tr.id)
    setError('')
    try {
      await api.deleteTraitor(tr.id)
      toast(t('traitors.deleteSuccess'))
      await reload(searched || undefined, page, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.deleteFailed'), 'error')
    } finally {
      setDeletingId(null)
      setPendingDelete(null)
    }
  }

  const handleDeletePhotos = async (tr: TraitorSummary) => {
    setPhotoDeletingId(tr.id)
    setError('')
    try {
      await api.deleteTraitorPhotos(tr.id)
      toast(t('traitors.deletePhotosSuccess'))
      await reload(searched || undefined, page, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.deletePhotosFailed'), 'error')
    } finally {
      setPhotoDeletingId(null)
      setPendingPhotoDelete(null)
    }
  }

  const allOnPageSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id))
  const someOnPageSelected = items.some((it) => selectedIds.has(it.id))

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someOnPageSelected && !allOnPageSelected
  }, [someOnPageSelected, allOnPageSelected])

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const it of items) {
        if (checked) next.add(it.id)
        else next.delete(it.id)
      }
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBatchDeleting(true)
    setError('')
    try {
      const data = await api.batchDeleteTraitors(ids)
      toast(t('traitors.batchDeleteSuccess', { count: data.count }))
      clearSelection()
      setPendingBatchDelete(false)
      // 当前页可能已全被删除，回到第一页
      await reload(searched || undefined, 1, level ? Number(level) : undefined)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.batchDeleteFailed'), 'error')
    } finally {
      setBatchDeleting(false)
    }
  }

  const handleBatchDeletePhotos = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBatchPhotoDeleting(true)
    setError('')
    try {
      const data = await api.batchDeleteTraitorPhotos(ids)
      toast(t('traitors.batchDeletePhotosSuccess', { count: data.count }))
      setPendingBatchPhotoDelete(false)
      await reload(searched || undefined, page, level ? Number(level) : undefined, hasPhoto ? hasPhoto === '1' : undefined)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.batchDeletePhotosFailed'), 'error')
    } finally {
      setBatchPhotoDeleting(false)
    }
  }

  const handleBatchExport = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBatchExporting(true)
    setError('')
    try {
      const data = await api.batchExportTraitors(ids)
      const rows = Array.isArray(data.items) ? data.items : []
      const csv = buildCsv(rows, (r) => {
        const cells = [
          r.name,
          r.birthYear ?? '',
          r.deathYear ?? '',
          r.period,
          r.faction,
          r.nativePlace ?? '',
          (r.identityTags ?? []).join(' / '),
          r.harmLevel != null ? t(`harmLevel.${r.harmLevel}`) : '',
          r.photoUrl ? resolveAssetUrl(r.photoUrl) : '',
        ]
        return cells.map(csvQuote).join(',')
      })
      downloadCsv(csv, `traitors-export-${new Date().toISOString().slice(0, 10)}.csv`)
      toast(t('traitors.batchExportSuccess', { count: rows.length }))
    } catch (e) {
      toast(e instanceof Error ? e.message : t('traitors.batchExportFailed'), 'error')
    } finally {
      setBatchExporting(false)
    }
  }

  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages])

  return (
    <div className="container-page py-1 px-1">
      <PageHeader
        title={t('traitors.title')}
        subtitle="Archive Management"
        actions={
          canManageUsers(me.role) ? (
            <button type="button" className="btn-primary" onClick={() => navigate('/traitors/new')}>
              {t('traitors.newTraitor')}
            </button>
          ) : null
        }
      />

      <div className="animate-fade-up mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 md:gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSearch()
          }}
        >
          <input
            className="input min-w-0 max-w-xs flex-1"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('traitors.searchPlaceholder')}
          />
          <select
            className="input w-32 flex-none"
            value={level}
            onChange={(e) => handleLevelChange(e.target.value)}
            disabled={loading}
            aria-label={t('common.colHarmLevel')}
          >
            <option value="">{t('common.all')}</option>
            {HARM_LEVELS.map((l) => (
              <option key={l} value={l}>
                {t(`harmLevel.${l}`)}
              </option>
            ))}
          </select>
          <select
            className="input w-28 flex-none"
            value={hasPhoto}
            onChange={(e) => handlePhotoChange(e.target.value)}
            disabled={loading}
            aria-label={t('traitors.hasPhoto')}
          >
            <option value="">{t('common.all')}</option>
            <option value="1">{t('traitors.withPhoto')}</option>
            <option value="0">{t('traitors.withoutPhoto')}</option>
          </select>
          <button type="submit" className="btn-bronze flex-none" disabled={loading}>
            {t('common.search')}
          </button>
          {(searched || level || hasPhoto) && (
            <button type="button" className="btn-ghost flex-none" onClick={handleReset}>
              {t('common.reset')}
            </button>
          )}
        </form>
        {/* {canManageUsers(me.role) && (
          <button
            type="button"
            className="btn-primary flex-none md:ml-2"
            onClick={() => navigate('/traitors/new')}
          >
            {t('traitors.newTraitor')}
          </button>
        )} */}
      </div>

      {selectedIds.size > 0 && (
        <div className="animate-fade-up mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-bronze/25 bg-bronze/5 px-4 py-3">
          <span className="mr-1 text-sm tracking-wider text-paperdim/80">
            {t('traitors.selectedCount', { count: selectedIds.size })}
          </span>
          {canManageUsers(me.role) && (
            <>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs text-paperdim hover:!text-cinnabar"
                disabled={batchPhotoDeleting}
                onClick={() => setPendingBatchPhotoDelete(true)}
              >
                {t('traitors.batchDeletePhotos')}
              </button>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs text-cinnabarlight/90 hover:!text-cinnabar"
                disabled={batchDeleting}
                onClick={() => setPendingBatchDelete(true)}
              >
                {t('traitors.batchDelete')}
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-ghost !px-3 !py-1.5 text-xs text-paperdim hover:!text-paper"
            disabled={batchExporting}
            onClick={() => void handleBatchExport()}
          >
            {t('traitors.batchExport')}
          </button>
          <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs text-paperdim/60 hover:!text-paper" onClick={clearSelection}>
            {t('traitors.clearSelection')}
          </button>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('traitors.noArchives')}</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-cinnabar"
                      checked={allOnPageSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      aria-label={t('traitors.selectAll')}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium w-[200px]">{t('common.name')}</th>
                  <th className="px-5 py-3 font-medium  w-[150px]">{t('common.period')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.faction')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.lifespan')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.identityTags')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.colHarmLevel')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tr) => (
                  <tr key={tr.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="h-6 w-6 cursor-pointer accent-cinnabar"
                        checked={selectedIds.has(tr.id)}
                        onChange={() => toggleSelect(tr.id)}
                        aria-label={t('common.select', { name: tr.name })}
                      />
                    </td>
                    <td className="px-5 py-3 w-[200px]">
                      <div className="flex items-center gap-3">
                        {showAvatar &&
                          (tr.photoUrl ? (
                            <img
                              src={resolveAssetUrl(tr.photoUrl)}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-sm object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-song text-xs text-paperdim/60">
                              {t('common.none')}
                            </span>
                          ))}
                        <span className="font-medium tracking-wider text-paper">{tr.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3  w-[150px] text-paperdim">{tr.period}</td>
                    <td className="px-5 py-3 text-paperdim">{tr.faction || '—'}</td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">
                      {formatLifeSpan(tr.birthYear, tr.deathYear, tr.birthYearType, tr.deathYearType)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {tr.identityTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                            {tag}
                          </span>
                        ))}
                        {tr.identityTags.length > 3 && (
                          <span className="badge border-paperedge/25 text-paperdim/70">
                            +{tr.identityTags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-1 py-1">
                      {canManageUsers(me.role) ? (
                        <select
                          className={`input mr-auto w-24 flex-none !py-1.5 px-2 text-xs ${harmLevelClass(tr.harmLevel)}`}
                          value={tr.harmLevel != null ? String(tr.harmLevel) : ''}
                          disabled={levelUpdatingId === tr.id}
                          onChange={(e) => void handleUpdateHarmLevel(tr, e.target.value)}
                          aria-label={t('traitors.updateHarmLevel')}
                        >
                          <option value="">{t('common.none')}</option>
                          {HARM_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {t(`harmLevel.${l}`)}
                            </option>
                          ))}
                        </select>
                      ) : tr.harmLevel ? (
                        <span className={`badge border-0 ${harmLevelClass(tr.harmLevel)}`}>
                          {t(`harmLevel.${tr.harmLevel}`)}
                        </span>
                      ) : (
                        <span className="text-paperdim/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canManageUsers(me.role) && (
                          <button
                            type="button"
                            className="btn-bronze !px-5 !py-2 text-sm !w-20"
                            onClick={() => {
                              window.open(`${window.location.href.split('#')[0]}#/traitors/${tr.id}/edit`, '_blank', 'noopener')
                            }}
                          >
                            {t('traitors.edit')}
                          </button>
                        )}
                        {canManageUsers(me.role) && (
                          <button
                            type="button"
                            className="btn-ghost !p-2 text-xs !text-paperdim hover:!text-cinnabarlight"
                            disabled={deletingId === tr.id}
                            onClick={() => setPendingDelete(tr)}
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                          >
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="h-4 w-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2.5 4h11M6.5 4V2.75h3V4M4 4l.6 8.25h6.8L12 4M6.5 6.5v3.5M9.5 6.5v3.5" />
                            </svg>
                          </button>
                        )}
                        {canManageUsers(me.role) && (
                          <button
                            type="button"
                            className="btn-ghost !p-2 text-xs text-paperdim hover:!text-cinnabar disabled:cursor-not-allowed disabled:opacity-30"
                            disabled={!tr.photoUrl || photoDeletingId === tr.id}
                            onClick={() => setPendingPhotoDelete(tr)}
                            aria-label={t('traitors.deletePhotos')}
                            title={t('traitors.deletePhotos')}
                          >
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                              className="h-4 w-4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 3.5h12M6.5 3.5V2.75h3V3.5M3.25 3.5l.5 9.25c.06 1.1.9 1.5 2 1.5h2.5c1.1 0 1.94-.4 2-1.5l.5-9.25" />
                              <path d="M10.25 6.75l-4.5 4.5M5.75 6.75l4.5 4.5" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs tracking-widest text-paperdim/80">
              {t('traitors.totalRecords', { total, page: totalPages === 0 ? 0 : page, totalPages })}
            </div>
            <nav className="flex flex-wrap items-center gap-1.5" aria-label={t('common.pagination')}>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                {t('common.prevPage')}
              </button>
              {pages.map((n, i) =>
                n === '…' ? (
                  <span
                    key={`e${i}`}
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
                    disabled={loading}
                    className={`h-8 min-w-8 rounded-sm border px-2 text-xs transition ${
                      n === page
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
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages || loading}
              >
                {t('common.nextPage')}
              </button>
            </nav>
          </div>
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        title={t('common.delete')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmBusy={deletingId !== null}
        onConfirm={() => pendingDelete && void handleDelete(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
        onClose={() => setPendingDelete(null)}
      >
        <p className="text-sm leading-relaxed text-paperdim">
          {pendingDelete && t('traitors.deleteConfirm', { name: pendingDelete.name })}
        </p>
      </Modal>

      <Modal
        open={pendingPhotoDelete !== null}
        title={t('traitors.deletePhotos')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmBusy={photoDeletingId !== null}
        onConfirm={() => pendingPhotoDelete && void handleDeletePhotos(pendingPhotoDelete)}
        onCancel={() => setPendingPhotoDelete(null)}
        onClose={() => setPendingPhotoDelete(null)}
      >
        <p className="text-sm leading-relaxed text-paperdim">
          {pendingPhotoDelete && t('traitors.deletePhotosConfirm', { name: pendingPhotoDelete.name })}
        </p>
      </Modal>

      <Modal
        open={pendingBatchDelete}
        title={t('traitors.batchDelete')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmBusy={batchDeleting}
        onConfirm={() => void handleBatchDelete()}
        onCancel={() => setPendingBatchDelete(false)}
        onClose={() => setPendingBatchDelete(false)}
      >
        <p className="text-sm leading-relaxed text-paperdim">
          {t('traitors.batchDeleteConfirm', { count: selectedIds.size })}
        </p>
      </Modal>

      <Modal
        open={pendingBatchPhotoDelete}
        title={t('traitors.batchDeletePhotos')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmBusy={batchPhotoDeleting}
        onConfirm={() => void handleBatchDeletePhotos()}
        onCancel={() => setPendingBatchPhotoDelete(false)}
        onClose={() => setPendingBatchPhotoDelete(false)}
      >
        <p className="text-sm leading-relaxed text-paperdim">
          {t('traitors.batchDeletePhotosConfirm', { count: selectedIds.size })}
        </p>
      </Modal>
    </div>
  )
}
