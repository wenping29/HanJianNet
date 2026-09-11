import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { PERIODS, splitList, formatLifeSpan } from '../lib/format'
import type { Child, CrimeRecord, Period, Spouse, TraitorDetail, TraitorInput, TraitorSummary, YearType } from '../types'

const PAGE_SIZE = 10

const PERIOD_KEYS: Record<string, string> = {
  '宋末': 'periods.lateSong',
  '明末': 'periods.lateMing',
  '清末': 'periods.lateQing',
  '民国': 'periods.republic',
  '抗日战争时期': 'periods.warOfResistance',
  '其他': 'periods.other',
}

const YEAR_TYPES: Array<{ value: YearType; key: string }> = [
  { value: 'exact', key: 'yearTypes.exact' },
  { value: 'approx', key: 'yearTypes.circa' },
  { value: 'before', key: 'yearTypes.before' },
  { value: 'after', key: 'yearTypes.after' },
  { value: 'unknown', key: 'yearTypes.unknown' },
]

function useRowList<T>(initial: T[]) {
  const [rows, setRows] = useState<T[]>(initial)
  const add = (...newRows: T[]) => setRows((r) => [...r, ...newRows])
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))
  const patch = (i: number, part: Partial<T>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...part } : row)))
  const setAll = (next: T[]) => setRows(next)
  return [rows, { add, remove, patch, setAll }] as const
}

function RowActions({ onRemove }: { onRemove: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onRemove}
      className="mt-1 h-9 shrink-0 rounded-sm border border-paperedge/25 px-3 text-xs text-paperdim hover:border-cinnabar hover:text-cinnabarlight"
    >
      {t('common.delete')}
    </button>
  )
}

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

interface BasicForm {
  name: string
  courtesyName: string
  pseudonym: string
  birthYear: string
  deathYear: string
  birthYearType: YearType
  deathYearType: YearType
  nativePlace: string
  birthPlace: string
  aliasesText: string
  identityTagsText: string
  period: Period
  faction: string
  summary: string
}

const EMPTY_FORM: BasicForm = {
  name: '',
  courtesyName: '',
  pseudonym: '',
  birthYear: '',
  deathYear: '',
  birthYearType: 'exact',
  deathYearType: 'exact',
  nativePlace: '',
  birthPlace: '',
  aliasesText: '',
  identityTagsText: '',
  period: '民国',
  faction: '',
  summary: '',
}

// ── 列表视图 ──────────────────────────────────────

function ListView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const reload = useCallback(async (name?: string, p = 1) => {
    setError('')
    try {
      const data = await api.adminTraitors(name || undefined, p, PAGE_SIZE)
      const list = Array.isArray(data.items) ? data.items : []
      const pageNum = typeof data.page === 'number' ? data.page : p
      const totalNum = typeof data.total === 'number' ? data.total : list.length
      const pageSizeNum = typeof data.pageSize === 'number' ? data.pageSize : PAGE_SIZE
      const totalPagesNum =
        typeof data.totalPages === 'number'
          ? data.totalPages
          : Math.max(1, Math.ceil(totalNum / Math.max(1, pageSizeNum)))
      setItems(list)
      setPage(pageNum)
      setTotal(totalNum)
      setTotalPages(totalPagesNum)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
    }
  }, [t])

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
    await reload(q, 1)
    setLoading(false)
  }

  const handleReset = async () => {
    setKeyword('')
    setSearched('')
    setLoading(true)
    await reload(undefined, 1)
    setLoading(false)
  }

  const goPage = async (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    setLoading(true)
    await reload(searched || undefined, next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoading(false)
  }

  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages])

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('basicEdit.title')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            Basic Info Editor
          </p>
        </div>
      </header>

      <p className="mt-3 text-sm text-paperdim">
        {t('basicEdit.description')}
      </p>

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
            placeholder={t('basicEdit.searchPlaceholder')}
          />
          <button type="submit" className="btn-bronze flex-none" disabled={loading}>
            {t('common.search')}
          </button>
          {searched && (
            <button type="button" className="btn-ghost flex-none" onClick={handleReset}>
              {t('common.reset')}
            </button>
          )}
        </form>
      </div>

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
                  <th className="px-5 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.period')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.faction')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.lifespan')}</th>
                  <th className="px-5 py-3 font-medium">{t('common.nativePlace')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('common.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tr) => (
                  <tr key={tr.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {tr.photoUrl ? (
                          <img
                            src={resolveAssetUrl(tr.photoUrl)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-song text-xs text-paperdim/60">
                            {t('common.none')}
                          </span>
                        )}
                        <span className="font-medium tracking-wider text-paper">{tr.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-paperdim">{tr.period}</td>
                    <td className="px-5 py-3 text-paperdim">{tr.faction || '—'}</td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">
                      {formatLifeSpan(tr.birthYear, tr.deathYear, tr.birthYearType, tr.deathYearType)}
                    </td>
                    <td className="px-5 py-3 text-paperdim">—</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          onClick={() => navigate(`/traitors/basic-edit/${tr.id}`)}
                        >
                          {t('basicEdit.editBasicInfo')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs tracking-widest text-paperdim/80">
              {t('basicEdit.totalRecords', { total, page: totalPages === 0 ? 0 : page, totalPages })}
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
    </div>
  )
}

// ── 编辑视图 ──────────────────────────────────────

function EditView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [form, setForm] = useState<BasicForm>(EMPTY_FORM)
  const [original, setOriginal] = useState<TraitorDetail | null>(null)
  const [spouses, spouseCtl] = useRowList<Spouse>([])
  const [children, childCtl] = useRowList<Child>([])
  const [crimes, crimeCtl] = useRowList<CrimeRecord>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    api
      .adminTraitor(id)
      .then(({ traitor }: { traitor: TraitorDetail }) => {
        setOriginal(traitor)
        setForm({
          name: traitor.name,
          courtesyName: traitor.courtesyName ?? '',
          pseudonym: traitor.pseudonym ?? '',
          birthYear: traitor.birthYear === null ? '' : String(traitor.birthYear),
          deathYear: traitor.deathYear === null ? '' : String(traitor.deathYear),
          birthYearType: traitor.birthYearType,
          deathYearType: traitor.deathYearType,
          nativePlace: traitor.nativePlace,
          birthPlace: traitor.birthPlace,
          aliasesText: traitor.aliases.join('，'),
          identityTagsText: traitor.identityTags.join('，'),
          period: (traitor.period as Period) || '民国',
          faction: traitor.faction,
          summary: traitor.summary,
        })
        spouseCtl.setAll(traitor.spouses.map((s) => ({ name: s.name, remark: s.remark ?? '' })))
        childCtl.setAll(
          traitor.children.map((c) => ({
            name: c.name,
            gender: c.gender ?? '',
            whereabouts: c.whereabouts ?? '',
            remark: c.remark ?? '',
          })),
        )
        crimeCtl.setAll(
          traitor.crimeRecords.map((c) => ({
            year: c.year,
            title: c.title,
            process: c.process ?? '',
            harm: c.harm ?? '',
            sourceRef: c.sourceRef ?? '',
          })),
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [id, t])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3500)
  }

  function update<K extends keyof BasicForm>(key: K, value: BasicForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError(t('basicEdit.pleaseFillName'))
    if (!form.summary.trim()) return setError(t('basicEdit.pleaseFillSummary'))
    if (!id || !original) return

    // 构建完整 payload：基本信息用表单值，其他数据保持原样
    const payload: TraitorInput = {
      name: form.name.trim(),
      courtesyName: form.courtesyName.trim() || undefined,
      pseudonym: form.pseudonym.trim() || undefined,
      birthYear: form.birthYear === '' ? null : Number(form.birthYear),
      deathYear: form.deathYear === '' ? null : Number(form.deathYear),
      birthYearType: form.birthYearType,
      deathYearType: form.deathYearType,
      nativePlace: form.nativePlace.trim(),
      birthPlace: form.birthPlace.trim(),
      aliases: splitList(form.aliasesText),
      identityTags: splitList(form.identityTagsText),
      period: form.period,
      faction: form.faction.trim(),
      summary: form.summary.trim(),
      // 配偶子女用表单值
      spouses: spouses.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), remark: s.remark?.trim() || undefined })),
      children: children.filter((c) => c.name.trim()).map((c) => ({
        name: c.name.trim(),
        gender: c.gender?.trim() || undefined,
        whereabouts: c.whereabouts?.trim() || undefined,
        remark: c.remark?.trim() || undefined,
      })),
      // 犯罪记录用表单值
      crimeRecords: crimes.filter((c) => c.title.trim()).map((c) => ({
        year: c.year,
        title: c.title.trim(),
        process: c.process?.trim() || undefined,
        harm: c.harm?.trim() || undefined,
        sourceRef: c.sourceRef?.trim() || undefined,
      })),
      // 以下保持原数据不变
      residences: original.residences.map((r) => ({
        place: r.place,
        period: r.period ?? undefined,
        remark: r.remark ?? undefined,
      })),
      lifeEvents: original.lifeEvents.map((l) => ({
        year: l.year,
        event: l.event,
        sourceRef: l.sourceRef ?? undefined,
      })),
      sources: original.sources.map((s) => ({
        citation: s.citation,
        credibility: s.credibility ?? undefined,
      })),
      relatedIds: original.relatedIds,
      attachments: original.attachments.map(({ id: aid, url, kind, fileType, caption }) => ({
        id: aid,
        url,
        kind,
        fileType,
        caption: caption ?? undefined,
      })),
    }

    setBusy(true)
    try {
      await api.updateTraitorDirect(id, payload)
      flash(t('basicEdit.basicInfoSaved'))
      // 刷新 original 以同步最新状态
      const { traitor } = await api.adminTraitor(id)
      setOriginal(traitor)
      spouseCtl.setAll(traitor.spouses.map((s) => ({ name: s.name, remark: s.remark ?? '' })))
      childCtl.setAll(
        traitor.children.map((c) => ({
          name: c.name,
          gender: c.gender ?? '',
          whereabouts: c.whereabouts ?? '',
          remark: c.remark ?? '',
        })),
      )
      crimeCtl.setAll(
        traitor.crimeRecords.map((c) => ({
          year: c.year,
          title: c.title,
          process: c.process ?? '',
          harm: c.harm ?? '',
          sourceRef: c.sourceRef ?? '',
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="container-page py-24 text-center text-paperdim">{t('common.loading')}</div>

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="text-xl font-semibold tracking-[0.25em] text-paper">{t('basicEdit.editBasicInfo')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            BASIC INFO · ADMIN DIRECT
          </p>
        </header>
        {notice && (
          <p className="rounded-sm border border-bronze/60 bg-bronze/15 px-3 py-2 text-sm text-bronzelight">
            {notice}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-paperdim">
        {t('basicEdit.description2')}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">{t('traitorEditor.basicInfo')}</span>
            <span className="font-garamond text-[10px] italic text-bronzelight">BASIC</span>
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="name">{t('traitorEditor.form.name')}</label>
              <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="courtesy">{t('common.courtesyName')}</label>
              <input id="courtesy" className="input" value={form.courtesyName} onChange={(e) => update('courtesyName', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pseudonym">{t('common.pseudonym')}</label>
              <input id="pseudonym" className="input" value={form.pseudonym} onChange={(e) => update('pseudonym', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="birthYear">{t('common.birthYear')}</label>
              <div className="flex gap-2">
                <input id="birthYear" type="number" className="input font-garamond" value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} />
                <select className="input !w-24" value={form.birthYearType} onChange={(e) => update('birthYearType', e.target.value as YearType)}>
                  {YEAR_TYPES.map((yt) => (
                    <option key={yt.value} value={yt.value}>{t(yt.key)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="deathYear">{t('common.deathYear')}</label>
              <div className="flex gap-2">
                <input id="deathYear" type="number" className="input font-garamond" value={form.deathYear} onChange={(e) => update('deathYear', e.target.value)} />
                <select className="input !w-24" value={form.deathYearType} onChange={(e) => update('deathYearType', e.target.value as YearType)}>
                  {YEAR_TYPES.map((yt) => (
                    <option key={yt.value} value={yt.value}>{t(yt.key)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="nativePlace">{t('common.nativePlace')}</label>
              <input id="nativePlace" className="input" value={form.nativePlace} onChange={(e) => update('nativePlace', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="birthPlace">{t('common.birthPlace')}</label>
              <input id="birthPlace" className="input" value={form.birthPlace} onChange={(e) => update('birthPlace', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="period">{t('traitorEditor.form.period')}</label>
              <select id="period" className="input" value={form.period} onChange={(e) => update('period', e.target.value as Period)}>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{t(PERIOD_KEYS[p])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="faction">{t('traitorEditor.form.faction')}</label>
              <input id="faction" className="input" value={form.faction} onChange={(e) => update('faction', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="aliases">{t('common.aliases')}</label>
              <input id="aliases" className="input" value={form.aliasesText} onChange={(e) => update('aliasesText', e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="tags">{t('common.tags')}</label>
              <input id="tags" className="input" placeholder={t('traitorEditor.form.tagsPlaceholder')} value={form.identityTagsText} onChange={(e) => update('identityTagsText', e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="summary">{t('traitorEditor.form.summary')}</label>
              <textarea id="summary" rows={5} className="input" value={form.summary} onChange={(e) => update('summary', e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">{t('traitorEditor.spouse')}</span>
            <span className="font-garamond text-[10px] italic text-bronzelight">SPOUSES</span>
          </legend>
          <div className="mt-2 space-y-2">
            {spouses.map((s, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.namePlaceholder')}
                  value={s.name}
                  onChange={(e) => spouseCtl.patch(i, { name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.remark')}
                  value={s.remark ?? ''}
                  onChange={(e) => spouseCtl.patch(i, { remark: e.target.value })}
                />
                <RowActions onRemove={() => spouseCtl.remove(i)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => spouseCtl.add({ name: '', remark: '' })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addSpouse')}
            </button>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">{t('traitorEditor.children')}</span>
            <span className="font-garamond text-[10px] italic text-bronzelight">CHILDREN</span>
          </legend>
          <div className="mt-2 space-y-2">
            {children.map((c, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_1fr_1fr_auto]">
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.namePlaceholder')}
                  value={c.name}
                  onChange={(e) => childCtl.patch(i, { name: e.target.value })}
                />
                <select
                  className="input"
                  value={c.gender ?? ''}
                  onChange={(e) => childCtl.patch(i, { gender: e.target.value })}
                >
                  <option value="">{t('traitorEditor.form.gender')}</option>
                  <option value="男">{t('traitorEditor.form.male')}</option>
                  <option value="女">{t('traitorEditor.form.female')}</option>
                  <option value="不详">{t('common.unknown')}</option>
                </select>
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.destination')}
                  value={c.whereabouts ?? ''}
                  onChange={(e) => childCtl.patch(i, { whereabouts: e.target.value })}
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.remark')}
                  value={c.remark ?? ''}
                  onChange={(e) => childCtl.patch(i, { remark: e.target.value })}
                />
                <RowActions onRemove={() => childCtl.remove(i)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => childCtl.add({ name: '', gender: '', whereabouts: '', remark: '' })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addChild')}
            </button>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">{t('traitorEditor.crimes')}</span>
            <span className="font-garamond text-[10px] italic text-bronzelight">CRIMES</span>
          </legend>
          <div className="mt-2 space-y-4">
            {crimes.map((c, i) => (
              <div key={i} className="rounded-sm border border-paperedge/15 p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[90px_1fr_auto]">
                  <input
                    type="number"
                    className="input font-garamond"
                    placeholder={t('traitorEditor.form.year')}
                    value={c.year ?? ''}
                    onChange={(e) =>
                      crimeCtl.patch(i, { year: e.target.value === '' ? null : Number(e.target.value) })
                    }
                  />
                  <input
                    className="input"
                    placeholder={t('traitorEditor.form.eventName')}
                    value={c.title}
                    onChange={(e) => crimeCtl.patch(i, { title: e.target.value })}
                  />
                  <RowActions onRemove={() => crimeCtl.remove(i)} />
                </div>
                <textarea
                  rows={2}
                  className="input mt-2"
                  placeholder={t('traitorEditor.form.process')}
                  value={c.process ?? ''}
                  onChange={(e) => crimeCtl.patch(i, { process: e.target.value })}
                />
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <textarea
                    rows={2}
                    className="input"
                    placeholder={t('traitorEditor.form.harm')}
                    value={c.harm ?? ''}
                    onChange={(e) => crimeCtl.patch(i, { harm: e.target.value })}
                  />
                  <input
                    className="input"
                    placeholder={t('traitorEditor.form.sourceRef')}
                    value={c.sourceRef ?? ''}
                    onChange={(e) => crimeCtl.patch(i, { sourceRef: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => crimeCtl.add({ year: null, title: '', process: '', harm: '', sourceRef: '' })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addCrime')}
            </button>
          </div>
        </fieldset>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate('/traitors/basic-edit')} className="btn-ghost">
            {t('common.returnToList')}
          </button>
          <button type="submit" className="btn-primary min-w-36" disabled={busy}>
            {busy ? t('common.saveInProgress') : t('common.saveBasicInfo')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function TraitorBasicEdit() {
  const { id } = useParams<{ id: string }>()
  return id ? <EditView /> : <ListView />
}
