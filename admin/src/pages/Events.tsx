import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { PERIODS, splitList } from '../lib/format'
import type { AtrocityEventDetail, AtrocityEventInput, AtrocityEventSummary } from '../types'

const PAGE_SIZE = 10

const PERIOD_KEYS: Record<string, string> = {
  '宋末': 'periods.lateSong',
  '明末': 'periods.lateMing',
  '清末': 'periods.lateQing',
  '民国': 'periods.republic',
  '抗日战争时期': 'periods.warOfResistance',
  '其他': 'periods.other',
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

interface EventForm {
  name: string
  alias: string
  eventType: string
  era: string
  year: string
  province: string
  city: string
  location: string
  isGeneral: boolean
  personCount: string
  keywordsText: string
  summary: string
}

const EMPTY_FORM: EventForm = {
  name: '',
  alias: '',
  eventType: '',
  era: '',
  year: '',
  province: '',
  city: '',
  location: '',
  isGeneral: false,
  personCount: '0',
  keywordsText: '',
  summary: '',
}

// ── 列表视图 ──────────────────────────────────────

function ListView() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<AtrocityEventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.listAtrocityEvents()
      setItems(Array.isArray(data.items) ? data.items : [])
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

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) =>
      [it.name, it.eventType, it.province, it.city, it.summary]
        .some((v) => (v ?? '').toLowerCase().includes(q)),
    )
  }, [items, keyword])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pages = useMemo(() => pageWindow(safePage, totalPages), [safePage, totalPages])

  const goPage = (next: number) => {
    if (next < 1 || next > totalPages || next === safePage) return
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('eventsAdmin.title')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            {t('eventsAdmin.subtitle')}
          </p>
        </div>
      </header>

      <p className="mt-3 text-sm text-paperdim">{t('eventsAdmin.description')}</p>

      <div className="animate-fade-up mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <input
            className="input min-w-0 max-w-xs flex-1"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(1)
            }}
            placeholder={t('eventsAdmin.searchPlaceholder')}
          />
          {keyword && (
            <button type="button" className="btn-ghost flex-none" onClick={() => setKeyword('')}>
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : pageItems.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('eventsAdmin.noEvents')}</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.name')}</th>
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.type')}</th>
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.era')}</th>
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.year')}</th>
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.region')}</th>
                  <th className="px-5 py-3 font-medium">{t('eventsAdmin.col.personCount')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('eventsAdmin.col.operation')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((ev) => (
                  <tr key={ev.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3">
                      <span className="font-medium tracking-wider text-paper">{ev.name}</span>
                    </td>
                    <td className="px-5 py-3 text-paperdim">{ev.eventType || '—'}</td>
                    <td className="px-5 py-3 text-paperdim">{ev.era || '—'}</td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">{ev.year ?? '—'}</td>
                    <td className="px-5 py-3 text-paperdim">
                      {[ev.province, ev.city].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">{ev.personCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          onClick={() => navigate(`/events/${ev.id}/edit`)}
                        >
                          {t('eventsAdmin.editBasicInfo')}
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
              {t('eventsAdmin.totalRecords', { total, page: safePage, totalPages })}
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
                disabled={safePage >= totalPages}
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

  const [form, setForm] = useState<EventForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fill = (ev: AtrocityEventDetail) => {
    setForm({
      name: ev.name ?? '',
      alias: ev.alias ?? '',
      eventType: ev.eventType ?? '',
      era: ev.era ?? '',
      year: ev.year === null || ev.year === undefined ? '' : String(ev.year),
      province: ev.province ?? '',
      city: ev.city ?? '',
      location: ev.location ?? '',
      isGeneral: !!ev.isGeneral,
      personCount: String(ev.personCount ?? 0),
      keywordsText: (ev.keywords ?? []).join('，'),
      summary: ev.summary ?? '',
    })
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    api
      .getAtrocityEvent(id)
      .then(({ item }) => fill(item))
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [id, t])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3500)
  }

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError(t('eventsAdmin.pleaseFillName'))
    if (!id) return

    const payload: AtrocityEventInput = {
      name: form.name.trim(),
      alias: form.alias.trim(),
      eventType: form.eventType.trim(),
      era: form.era,
      year: form.year.trim() === '' ? null : Number(form.year),
      province: form.province.trim(),
      city: form.city.trim(),
      location: form.location.trim(),
      isGeneral: form.isGeneral,
      personCount: form.personCount.trim() === '' ? 0 : Number(form.personCount),
      summary: form.summary,
      keywords: splitList(form.keywordsText),
    }

    setBusy(true)
    try {
      await api.updateAtrocityEvent(id, payload)
      flash(t('eventsAdmin.saved'))
      const { item } = await api.getAtrocityEvent(id)
      fill(item)
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
          <h1 className="text-xl font-semibold tracking-[0.25em] text-paper">{t('eventsAdmin.editTitle')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            {t('eventsAdmin.editSubtitle')}
          </p>
        </header>
        {notice && (
          <p className="rounded-sm border border-bronze/60 bg-bronze/15 px-3 py-2 text-sm text-bronzelight">
            {notice}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-paperdim">{t('eventsAdmin.description2')}</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <fieldset className="card p-6">
          <legend className="flex items-baseline gap-2 px-2">
            <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">
              {t('eventsAdmin.editTitle')}
            </span>
            <span className="font-garamond text-[10px] italic text-bronzelight">BASIC</span>
          </legend>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="name">{t('eventsAdmin.form.name')}</label>
              <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="alias">{t('eventsAdmin.form.alias')}</label>
              <input id="alias" className="input" value={form.alias} onChange={(e) => update('alias', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="eventType">{t('eventsAdmin.form.eventType')}</label>
              <input
                id="eventType"
                className="input"
                placeholder={t('eventsAdmin.form.eventTypePlaceholder')}
                value={form.eventType}
                onChange={(e) => update('eventType', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="era">{t('eventsAdmin.form.era')}</label>
              <select id="era" className="input" value={form.era} onChange={(e) => update('era', e.target.value)}>
                <option value="">{t('eventsAdmin.form.eraUnset')}</option>
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{t(PERIOD_KEYS[p])}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="year">{t('eventsAdmin.form.year')}</label>
              <input
                id="year"
                type="number"
                className="input font-garamond"
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="personCount">{t('eventsAdmin.form.personCount')}</label>
              <input
                id="personCount"
                type="number"
                className="input font-garamond"
                value={form.personCount}
                onChange={(e) => update('personCount', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="province">{t('eventsAdmin.form.province')}</label>
              <input id="province" className="input" value={form.province} onChange={(e) => update('province', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="city">{t('eventsAdmin.form.city')}</label>
              <input id="city" className="input" value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="location">{t('eventsAdmin.form.location')}</label>
              <input id="location" className="input" value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-paperdim" htmlFor="isGeneral">
                <input
                  id="isGeneral"
                  type="checkbox"
                  className="h-4 w-4 accent-cinnabar"
                  checked={form.isGeneral}
                  onChange={(e) => update('isGeneral', e.target.checked)}
                />
                {t('eventsAdmin.form.isGeneral')}
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="keywords">{t('eventsAdmin.form.keywords')}</label>
              <input
                id="keywords"
                className="input"
                placeholder={t('eventsAdmin.form.keywordsPlaceholder')}
                value={form.keywordsText}
                onChange={(e) => update('keywordsText', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="summary">{t('eventsAdmin.form.summary')}</label>
              <textarea
                id="summary"
                rows={8}
                className="input"
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate('/events')} className="btn-ghost">
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

export default function Events() {
  const { id } = useParams<{ id: string }>()
  return id ? <EditView /> : <ListView />
}
