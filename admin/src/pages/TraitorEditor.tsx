import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { PERIODS, splitList } from '../lib/format'
import type {
  Attachment,
  AttachmentKind,
  Child,
  CrimeRecord,
  LifeEvent,
  Period,
  Residence,
  SourceRef,
  Spouse,
  TraitorDetail,
  TraitorInput,
  TraitorSummary,
  YearType,
} from '../types'

const PERIOD_KEYS: Record<string, string> = {
  '宋末': 'periods.lateSong',
  '明末': 'periods.lateMing',
  '清末': 'periods.lateQing',
  '民国': 'periods.republic',
  '抗日战争时期': 'periods.warOfResistance',
  '其他': 'periods.other',
}

interface FormState {
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

const EMPTY_FORM: FormState = {
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

function Fieldset({ title, en, children }: { title: string; en?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-6">
      <legend className="flex items-baseline gap-2 px-2">
        <span className="text-sm font-semibold tracking-[0.25em] text-cinnabarlight">{title}</span>
        {en && <span className="font-garamond text-[10px] italic text-bronzelight">{en}</span>}
      </legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  )
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

export default function TraitorEditor({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [spouses, spouseCtl] = useRowList<Spouse>([])
  const [children, childCtl] = useRowList<Child>([])
  const [residences, residenceCtl] = useRowList<Residence>([])
  const [crimeRecords, crimeCtl] = useRowList<CrimeRecord>([])
  const [lifeEvents, lifeCtl] = useRowList<LifeEvent>([])
  const [sources, sourceCtl] = useRowList<SourceRef>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [relatedIds, setRelatedIds] = useState<string[]>([])
  const [candidates, setCandidates] = useState<TraitorSummary[]>([])
  const [notice, setNotice] = useState('')

  const [loading, setLoading] = useState(mode === 'edit')
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .adminTraitors()
      .then((d) => setCandidates(d.items))
      .catch(() => setCandidates([]))
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    setLoading(true)
    setError('')
    api
      .adminTraitor(id)
      .then(({ traitor }: { traitor: TraitorDetail }) => {
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
        spouseCtl.setAll(traitor.spouses.map((s) => ({ name: s.name, remark: s.remark ?? undefined })))
        childCtl.setAll(
          traitor.children.map((c) => ({
            name: c.name,
            gender: c.gender ?? '',
            whereabouts: c.whereabouts ?? '',
            remark: c.remark ?? undefined,
          })),
        )
        residenceCtl.setAll(
          traitor.residences.map((r) => ({
            place: r.place,
            period: r.period ?? undefined,
            remark: r.remark ?? undefined,
          })),
        )
        crimeCtl.setAll(
          traitor.crimeRecords.map((c) => ({
            year: c.year,
            title: c.title,
            process: c.process ?? undefined,
            harm: c.harm ?? undefined,
            sourceRef: c.sourceRef ?? undefined,
          })),
        )
        lifeCtl.setAll(
          traitor.lifeEvents.map((l) => ({
            year: l.year,
            event: l.event,
            sourceRef: l.sourceRef ?? undefined,
          })),
        )
        sourceCtl.setAll(
          traitor.sources.map((s) => ({
            citation: s.citation,
            credibility: s.credibility ?? undefined,
          })),
        )
        setAttachments(traitor.attachments)
        setRelatedIds(traitor.relatedIds)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')))
      .finally(() => setLoading(false))
  }, [mode, id, t])

  const relatedCandidates = useMemo(
    () => candidates.filter((c) => c.id !== id && !relatedIds.includes(c.id)),
    [candidates, id, relatedIds],
  )

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3500)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleUpload(files: FileList | null, kind: AttachmentKind) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const att = await api.upload(file, kind)
        setAttachments((a) => [...a, att])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError(t('traitorEditor.pleaseFillName'))
    if (!form.summary.trim()) return setError(t('traitorEditor.pleaseFillSummary'))

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
      spouses: spouses.filter((s) => s.name.trim()),
      children: children.filter((c) => c.name.trim()),
      residences: residences.filter((r) => r.place.trim()),
      crimeRecords: crimeRecords.filter((c) => c.title.trim()),
      lifeEvents: lifeEvents.filter((l) => l.event.trim()),
      sources: sources.filter((s) => s.citation.trim()),
      relatedIds,
      attachments: attachments.map(({ id: aid, url, kind, fileType, caption }) => ({
        id: aid,
        url,
        kind,
        fileType,
        caption: caption ?? undefined,
      })),
    }

    setBusy(true)
    try {
      if (mode === 'create') {
        await api.createTraitorDirect(payload)
        flash(t('traitorEditor.createSuccess'))
      } else if (id) {
        await api.updateTraitorDirect(id, payload)
        flash(t('traitorEditor.saveSuccess'))
      }
      navigate('/traitors/list', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('traitorEditor.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="container-page py-24 text-center text-paperdim">{t('common.loading')}</div>

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <h1 className="text-xl font-semibold tracking-[0.25em] text-paper">
            {mode === 'create' ? t('traitorEditor.createTitle') : t('traitorEditor.editTitle')}
          </h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">
            {mode === 'create' ? 'NEW ARCHIVE · ADMIN DIRECT' : 'EDIT ARCHIVE · ADMIN DIRECT'}
          </p>
        </header>
        {notice && (
          <p className="rounded-sm border border-bronze/60 bg-bronze/15 px-3 py-2 text-sm text-bronzelight">
            {notice}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-paperdim">
        {t('traitorEditor.adminHint')}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <Fieldset title={t('traitorEditor.basicInfo')} en="BASIC">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label" htmlFor="name">
                {t('traitorEditor.form.name')}
              </label>
              <input
                id="name"
                className="input"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="courtesy">
                {t('traitorEditor.form.courtesyName')}
              </label>
              <input
                id="courtesy"
                className="input"
                value={form.courtesyName}
                onChange={(e) => update('courtesyName', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="pseudonym">
                {t('traitorEditor.form.pseudonym')}
              </label>
              <input
                id="pseudonym"
                className="input"
                value={form.pseudonym}
                onChange={(e) => update('pseudonym', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="birthYear">
                {t('traitorEditor.form.birthYear')}
              </label>
              <div className="flex gap-2">
                <input
                  id="birthYear"
                  type="number"
                  className="input font-garamond"
                  value={form.birthYear}
                  onChange={(e) => update('birthYear', e.target.value)}
                />
                <select
                  className="input !w-24"
                  value={form.birthYearType}
                  onChange={(e) => update('birthYearType', e.target.value as YearType)}
                >
                  {YEAR_TYPES.map((yt) => (
                    <option key={yt.value} value={yt.value}>
                      {t(yt.key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="deathYear">
                {t('traitorEditor.form.deathYear')}
              </label>
              <div className="flex gap-2">
                <input
                  id="deathYear"
                  type="number"
                  className="input font-garamond"
                  value={form.deathYear}
                  onChange={(e) => update('deathYear', e.target.value)}
                />
                <select
                  className="input !w-24"
                  value={form.deathYearType}
                  onChange={(e) => update('deathYearType', e.target.value as YearType)}
                >
                  {YEAR_TYPES.map((yt) => (
                    <option key={yt.value} value={yt.value}>
                      {t(yt.key)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="nativePlace">
                {t('traitorEditor.form.nativePlace')}
              </label>
              <input
                id="nativePlace"
                className="input"
                value={form.nativePlace}
                onChange={(e) => update('nativePlace', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="birthPlace">
                {t('traitorEditor.form.birthPlace')}
              </label>
              <input
                id="birthPlace"
                className="input"
                value={form.birthPlace}
                onChange={(e) => update('birthPlace', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="period">
                {t('traitorEditor.form.period')}
              </label>
              <select
                id="period"
                className="input"
                value={form.period}
                onChange={(e) => update('period', e.target.value as Period)}
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {t(PERIOD_KEYS[p])}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="faction">
                {t('traitorEditor.form.faction')}
              </label>
              <input
                id="faction"
                className="input"
                value={form.faction}
                onChange={(e) => update('faction', e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="aliases">
                {t('traitorEditor.form.aliases')}
              </label>
              <input
                id="aliases"
                className="input"
                value={form.aliasesText}
                onChange={(e) => update('aliasesText', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="tags">
                {t('traitorEditor.form.tags')}
              </label>
              <input
                id="tags"
                className="input"
                placeholder={t('traitorEditor.form.tagsPlaceholder')}
                value={form.identityTagsText}
                onChange={(e) => update('identityTagsText', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label" htmlFor="summary">
                {t('traitorEditor.form.summary')}
              </label>
              <textarea
                id="summary"
                rows={5}
                className="input"
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
              />
            </div>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.lifeEvents')} en="LIFE EVENTS">
          <div className="space-y-3">
            {lifeEvents.map((ev, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[90px_1fr_1fr_auto]">
                <input
                  type="number"
                  className="input font-garamond"
                  placeholder={t('traitorEditor.form.year')}
                  value={ev.year ?? ''}
                  onChange={(e) =>
                    lifeCtl.patch(i, { year: e.target.value === '' ? null : Number(e.target.value) })
                  }
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.eventDesc')}
                  value={ev.event}
                  onChange={(e) => lifeCtl.patch(i, { event: e.target.value })}
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.sourceRef')}
                  value={ev.sourceRef ?? ''}
                  onChange={(e) => lifeCtl.patch(i, { sourceRef: e.target.value })}
                />
                <RowActions onRemove={() => lifeCtl.remove(i)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => lifeCtl.add({ year: null, event: '', sourceRef: '' })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addLifeEvent')}
            </button>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.crimes')} en="CRIMES">
          <div className="space-y-4">
            {crimeRecords.map((c, i) => (
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
              onClick={() =>
                crimeCtl.add({ year: null, title: '', process: '', harm: '', sourceRef: '' })
              }
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addCrime')}
            </button>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.family')} en="FAMILY">
          <p className="mb-2 text-xs tracking-widest text-paperdim">{t('traitorEditor.spouse')}</p>
          <div className="space-y-2">
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

          <p className="mb-2 mt-6 text-xs tracking-widest text-paperdim">{t('traitorEditor.children')}</p>
          <div className="space-y-2">
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
        </Fieldset>

        <Fieldset title={t('traitorEditor.residences')} en="RESIDENCES">
          <div className="space-y-2">
            {residences.map((r, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.place')}
                  value={r.place}
                  onChange={(e) => residenceCtl.patch(i, { place: e.target.value })}
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.residencePeriod')}
                  value={r.period ?? ''}
                  onChange={(e) => residenceCtl.patch(i, { period: e.target.value })}
                />
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.remark')}
                  value={r.remark ?? ''}
                  onChange={(e) => residenceCtl.patch(i, { remark: e.target.value })}
                />
                <RowActions onRemove={() => residenceCtl.remove(i)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => residenceCtl.add({ place: '', period: '', remark: '' })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addResidence')}
            </button>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.photosAndEvidence')} en="ATTACHMENTS">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs tracking-widest text-paperdim">{t('traitorEditor.photo')}</p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-paperedge/30 px-4 py-8 text-sm text-paperdim hover:border-bronzelight hover:text-paper">
                {uploading ? t('traitorEditor.uploading') : t('traitorEditor.selectImages')}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => handleUpload(e.target.files, 'photo')}
                />
              </label>
              <ul className="mt-3 space-y-2">
                {attachments
                  .filter((a) => a.kind === 'photo')
                  .map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-sm border border-paperedge/15 p-2"
                    >
                      <img
                        src={resolveAssetUrl(a.url)}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-sm object-cover"
                      />
                      <input
                        className="input !py-1.5 text-xs"
                        placeholder={t('traitorEditor.imageCaption')}
                        value={a.caption ?? ''}
                        onChange={(e) =>
                          setAttachments((list) =>
                            list.map((x) => (x.id === a.id ? { ...x, caption: e.target.value } : x)),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                        className="shrink-0 text-xs text-paperdim hover:text-cinnabarlight"
                      >
                        {t('traitorEditor.remove')}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs tracking-widest text-paperdim">{t('traitorEditor.evidence')}</p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-paperedge/30 px-4 py-8 text-sm text-paperdim hover:border-cinnabar hover:text-paper">
                {uploading ? t('traitorEditor.uploading') : t('traitorEditor.selectFiles')}
                <input type="file" multiple hidden onChange={(e) => handleUpload(e.target.files, 'evidence')} />
              </label>
              <ul className="mt-3 space-y-2">
                {attachments
                  .filter((a) => a.kind === 'evidence')
                  .map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-sm border border-paperedge/15 p-2"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-garamond text-bronzelight">
                        文
                      </span>
                      <input
                        className="input !py-1.5 text-xs"
                        placeholder={t('traitorEditor.evidenceCaption')}
                        value={a.caption ?? ''}
                        onChange={(e) =>
                          setAttachments((list) =>
                            list.map((x) => (x.id === a.id ? { ...x, caption: e.target.value } : x)),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                        className="shrink-0 text-xs text-paperdim hover:text-cinnabarlight"
                      >
                        {t('traitorEditor.remove')}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.references')} en="REFERENCES">
          <div className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_auto]">
                <input
                  className="input"
                  placeholder={t('traitorEditor.form.citation')}
                  value={s.citation}
                  onChange={(e) => sourceCtl.patch(i, { citation: e.target.value })}
                />
                <select
                  className="input"
                  value={s.credibility ?? 3}
                  onChange={(e) => sourceCtl.patch(i, { credibility: Number(e.target.value) })}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {t('traitorEditor.form.credibility')} {'★'.repeat(n)}
                    </option>
                  ))}
                </select>
                <RowActions onRemove={() => sourceCtl.remove(i)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => sourceCtl.add({ citation: '', credibility: 3 })}
              className="btn-ghost !py-1.5 text-xs"
            >
              {t('traitorEditor.addReference')}
            </button>
          </div>
        </Fieldset>

        <Fieldset title={t('traitorEditor.related')} en="RELATED">
          {relatedIds.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {relatedIds.map((rid) => {
                const cand = candidates.find((c) => c.id === rid)
                return (
                  <button
                    key={rid}
                    type="button"
                    onClick={() => setRelatedIds((ids) => ids.filter((x) => x !== rid))}
                    className="badge border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight"
                  >
                    {cand?.name ?? rid} ✕
                  </button>
                )
              })}
            </div>
          )}
          {relatedCandidates.length > 0 && (
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {relatedCandidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setRelatedIds((ids) => [...ids, c.id])}
                  className="badge border-paperedge/25 text-paperdim hover:border-bronzelight hover:text-paper"
                >
                  + {c.name}
                </button>
              ))}
            </div>
          )}
          {candidates.length === 0 && <p className="text-xs text-paperdim/60">{t('traitorEditor.noRelated')}</p>}
        </Fieldset>

        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary min-w-36" disabled={busy || uploading}>
            {busy ? t('common.saveInProgress') : mode === 'create' ? t('traitorEditor.saveDraft') : t('traitorEditor.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  )
}
