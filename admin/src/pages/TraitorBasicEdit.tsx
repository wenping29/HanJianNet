import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { PERIODS, splitList, formatLifeSpan } from '../lib/format'
import type { Period, TraitorDetail, TraitorInput, TraitorSummary, YearType } from '../types'

const PAGE_SIZE = 10

const YEAR_TYPES: Array<{ value: YearType; label: string }> = [
  { value: 'exact', label: '确切' },
  { value: 'approx', label: '约' },
  { value: 'before', label: '之前' },
  { value: 'after', label: '之后' },
  { value: 'unknown', label: '不详' },
]

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
  aliasesText: '',
  identityTagsText: '',
  period: '民国',
  faction: '',
  summary: '',
}

// ── 列表视图 ──────────────────────────────────────

function ListView() {
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
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

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
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">基本信息编辑</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            Basic Info Editor
          </p>
        </div>
      </header>

      <p className="mt-3 text-sm text-paperdim">
        选择档案编辑<span className="text-bronzelight">基本信息</span>（姓名、生卒、籍贯、概述等），其他数据不受影响。
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
            placeholder="按姓名 / 别名搜索"
          />
          <button type="submit" className="btn-bronze flex-none" disabled={loading}>
            搜索
          </button>
          {searched && (
            <button type="button" className="btn-ghost flex-none" onClick={handleReset}>
              重置
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
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无档案</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">姓名</th>
                  <th className="px-5 py-3 font-medium">时期</th>
                  <th className="px-5 py-3 font-medium">派系</th>
                  <th className="px-5 py-3 font-medium">生卒</th>
                  <th className="px-5 py-3 font-medium">籍贯</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {t.photoUrl ? (
                          <img
                            src={resolveAssetUrl(t.photoUrl)}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-song text-xs text-paperdim/60">
                            无
                          </span>
                        )}
                        <span className="font-medium tracking-wider text-paper">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-paperdim">{t.period}</td>
                    <td className="px-5 py-3 text-paperdim">{t.faction || '—'}</td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">
                      {formatLifeSpan(t.birthYear, t.deathYear, t.birthYearType, t.deathYearType)}
                    </td>
                    <td className="px-5 py-3 text-paperdim">—</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          onClick={() => navigate(`/traitors/basic-edit/${t.id}`)}
                        >
                          编辑基本信息
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
              共 <span className="font-garamond text-paper">{total}</span> 条档案 · 第
              <span className="mx-1 font-garamond text-paper">{totalPages === 0 ? 0 : page}</span>
              / <span className="font-garamond text-paper">{totalPages}</span> 页
            </div>
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="分页">
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                上一页
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
                下一页
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
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [form, setForm] = useState<BasicForm>(EMPTY_FORM)
  const [original, setOriginal] = useState<TraitorDetail | null>(null)
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
          aliasesText: traitor.aliases.join('，'),
          identityTagsText: traitor.identityTags.join('，'),
          period: (traitor.period as Period) || '民国',
          faction: traitor.faction,
          summary: traitor.summary,
        })
      })
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [id])

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
    if (!form.name.trim()) return setError('请填写姓名')
    if (!form.summary.trim()) return setError('请填写人物概述')
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
      aliases: splitList(form.aliasesText),
      identityTags: splitList(form.identityTagsText),
      period: form.period,
      faction: form.faction.trim(),
      summary: form.summary.trim(),
      // 以下保持原数据不变
      spouses: original.spouses.map((s) => ({ name: s.name, remark: s.remark ?? undefined })),
      children: original.children.map((c) => ({
        name: c.name,
        gender: c.gender ?? undefined,
        whereabouts: c.whereabouts ?? undefined,
        remark: c.remark ?? undefined,
      })),
      residences: original.residences.map((r) => ({
        place: r.place,
        period: r.period ?? undefined,
        remark: r.remark ?? undefined,
      })),
      crimeRecords: original.crimeRecords.map((c) => ({
        year: c.year,
        title: c.title,
        process: c.process ?? undefined,
        harm: c.harm ?? undefined,
        sourceRef: c.sourceRef ?? undefined,
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
      flash('基本信息已保存')
      // 刷新 original 以同步最新状态
      const { traitor } = await api.adminTraitor(id)
      setOriginal(traitor)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="container-page py-24 text-center text-paperdim">加载中…</div>

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="text-xl font-semibold tracking-[0.25em] text-paper">编辑基本信息</h1>
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
        仅修改基本信息，<span className="text-bronzelight">其他数据（生平、犯罪记录、家族等）保持不变</span>。
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">基本信息</span>
            <span className="font-garamond text-[10px] italic text-bronzelight">BASIC</span>
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="name">姓名 *</label>
              <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="courtesy">字</label>
              <input id="courtesy" className="input" value={form.courtesyName} onChange={(e) => update('courtesyName', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pseudonym">号</label>
              <input id="pseudonym" className="input" value={form.pseudonym} onChange={(e) => update('pseudonym', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="birthYear">出生年份</label>
              <div className="flex gap-2">
                <input id="birthYear" type="number" className="input font-garamond" value={form.birthYear} onChange={(e) => update('birthYear', e.target.value)} />
                <select className="input !w-24" value={form.birthYearType} onChange={(e) => update('birthYearType', e.target.value as YearType)}>
                  {YEAR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="deathYear">去世年份</label>
              <div className="flex gap-2">
                <input id="deathYear" type="number" className="input font-garamond" value={form.deathYear} onChange={(e) => update('deathYear', e.target.value)} />
                <select className="input !w-24" value={form.deathYearType} onChange={(e) => update('deathYearType', e.target.value as YearType)}>
                  {YEAR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="nativePlace">籍贯</label>
              <input id="nativePlace" className="input" value={form.nativePlace} onChange={(e) => update('nativePlace', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="period">历史时期 *</label>
              <select id="period" className="input" value={form.period} onChange={(e) => update('period', e.target.value as Period)}>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="faction">派系 / 伪政权</label>
              <input id="faction" className="input" value={form.faction} onChange={(e) => update('faction', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="aliases">别名（逗号分隔）</label>
              <input id="aliases" className="input" value={form.aliasesText} onChange={(e) => update('aliasesText', e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="tags">身份标签（逗号分隔）</label>
              <input id="tags" className="input" placeholder="如：伪政权要员，战犯" value={form.identityTagsText} onChange={(e) => update('identityTagsText', e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="summary">人物概述 *</label>
              <textarea id="summary" rows={5} className="input" value={form.summary} onChange={(e) => update('summary', e.target.value)} />
            </div>
          </div>
        </fieldset>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate('/traitors/basic-edit')} className="btn-ghost">
            返回列表
          </button>
          <button type="submit" className="btn-primary min-w-36" disabled={busy}>
            {busy ? '保存中…' : '保存基本信息'}
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
