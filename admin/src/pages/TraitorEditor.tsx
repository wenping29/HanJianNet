import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { PERIODS, formatLifeSpan, formatYear, splitList } from '../lib/format'
import { normalizeAiResult } from '../lib/ai'
import type { NormalizedAi } from '../lib/ai'
import AiQueryModal, { useAiQuery } from '../components/AiQueryModal'
import Modal from '../components/Modal'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type {
  Attachment,
  AttachmentKind,
  AiTraitorResult,
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

function PreviewSection({ title, en, children }: { title: string; en: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="flex items-baseline gap-2 border-b border-paperedge/15 pb-2">
        <span className="text-sm font-semibold tracking-[0.2em] text-paper">{title}</span>
        <span className="font-garamond text-[10px] italic text-bronzelight">{en}</span>
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

interface PreviewPaneProps {
  form: FormState
  spouses: Spouse[]
  children: Child[]
  residences: Residence[]
  crimeRecords: CrimeRecord[]
  lifeEvents: LifeEvent[]
  sources: SourceRef[]
  attachments: Attachment[]
  relatedIds: string[]
  candidates: TraitorSummary[]
}

function PreviewPane({
  form,
  spouses,
  children,
  residences,
  crimeRecords,
  lifeEvents,
  sources,
  attachments,
  relatedIds,
  candidates,
}: PreviewPaneProps) {
  const { t } = useTranslation()
  const photos = attachments.filter((a) => a.kind === 'photo')
  const evidences = attachments.filter((a) => a.kind === 'evidence')
  const photoUrl = (a: { url: string }) => resolveAssetUrl(a.url)
  const aliases = splitList(form.aliasesText)
  const identityTags = splitList(form.identityTagsText)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-[0.25em] text-bronzelight">{t('traitorEditor.previewLive')}</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest text-paperdim/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cinnabar opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cinnabar" />
          </span>
          LIVE
        </span>
      </div>

      {/* 人物头部 */}
      <header className="mt-5 flex flex-col gap-5 rounded-sm border border-paperedge/15 bg-inksoft/40 p-5 sm:flex-row">
        <div className="flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-sm border border-paperedge/15 bg-inkcard sm:w-32">
          {photos[0] ? (
            <img src={photoUrl(photos[0])} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-song text-6xl font-bold text-paperedge/20">
              {(form.name || '？').slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold tracking-[0.15em] text-paper">{form.name || t('common.unknown')}</h3>
            {form.period && <span className="badge border-cinnabar/70 bg-cinnabar/15 text-cinnabarlight">{form.period}</span>}
            {form.faction && <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{form.faction}</span>}
          </div>
          {(form.courtesyName || form.pseudonym) && (
            <p className="mt-2 text-xs tracking-widest text-paperdim">
              {form.courtesyName && <span className="mr-4">{t('snapshot.courtesyName')}{form.courtesyName}</span>}
              {form.pseudonym && <span>{t('snapshot.pseudonym')}{form.pseudonym}</span>}
            </p>
          )}
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="shrink-0 text-paperdim/70">{t('snapshot.lifespan')}</dt>
              <dd className="font-garamond text-paper/90">
                {formatLifeSpan(
                  form.birthYear === '' ? null : Number(form.birthYear),
                  form.deathYear === '' ? null : Number(form.deathYear),
                  form.birthYearType,
                  form.deathYearType,
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-paperdim/70">{t('snapshot.nativePlace')}</dt>
              <dd className="text-paper/90">{form.nativePlace || '—'}</dd>
            </div>
          </dl>
          {aliases.length > 0 && (
            <p className="mt-2 text-xs text-paperdim/80">
              <span className="mr-2 text-paperdim/70">{t('snapshot.aliases')}</span>
              {aliases.join('、')}
            </p>
          )}
          {identityTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {identityTags.map((tag) => (
                <span key={tag} className="badge border-paperedge/25 text-paperdim">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 摘要 */}
      {form.summary && (
        <PreviewSection title={t('snapshot.summary')} en="SUMMARY">
          <p className="whitespace-pre-line text-xs leading-loose text-paper/90">{form.summary}</p>
        </PreviewSection>
      )}

      {/* 生平时间线 */}
      {lifeEvents.length > 0 && (
        <PreviewSection title={t('snapshot.lifeTimeline')} en="CHRONOLOGY">
          <ol className="relative ml-1 space-y-3 border-l border-cinnabar/40 pl-4">
            {[...lifeEvents]
              .filter((ev) => ev.event)
              .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
              .map((ev, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-cinnabar bg-ink" />
                  <p className="font-garamond text-xs font-semibold text-bronzelight">{formatYear(ev.year, 'exact')}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-paper/90">{ev.event}</p>
                  {ev.sourceRef && <p className="mt-0.5 text-[10px] text-paperdim/60">{t('common.origin')}{ev.sourceRef}</p>}
                </li>
              ))}
          </ol>
        </PreviewSection>
      )}

      {/* 犯罪记录 */}
      {crimeRecords.filter((c) => c.title).length > 0 && (
        <PreviewSection title={t('snapshot.crimes')} en="CRIMINAL RECORDS">
          <div className="grid grid-cols-1 gap-3">
            {crimeRecords
              .filter((c) => c.title)
              .map((c, i) => (
                <article key={i} className="rounded-sm border border-paperedge/15 p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="text-xs font-semibold tracking-wider text-cinnabarlight">{c.title}</h4>
                    <span className="font-garamond text-sm text-bronzelight">{formatYear(c.year, 'exact')}</span>
                  </div>
                  {c.process && <p className="mt-2 text-xs leading-relaxed text-paper/85">{c.process}</p>}
                  {c.harm && (
                    <p className="mt-1.5 text-xs leading-relaxed text-paper/85">
                      <span className="mr-1.5 badge border-cinnabar/40 px-1.5 py-0.5 text-[10px] text-cinnabarlight/90">
                        {t('snapshot.harm')}
                      </span>
                      {c.harm}
                    </p>
                  )}
                  {c.sourceRef && <p className="mt-1.5 text-[10px] text-paperdim/60">{c.sourceRef}</p>}
                </article>
              ))}
          </div>
        </PreviewSection>
      )}

      {/* 家族 */}
      {(spouses.filter((s) => s.name).length > 0 || children.filter((c) => c.name).length > 0) && (
        <PreviewSection title={t('snapshot.familyAndResidence')} en="FAMILY">
          {spouses.filter((s) => s.name).length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] tracking-widest text-paperdim/70">{t('snapshot.spouse')}</p>
              <ul className="space-y-1.5">
                {spouses
                  .filter((s) => s.name)
                  .map((s, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-xs">
                      <span className="font-semibold tracking-widest text-paper">{s.name}</span>
                      {s.remark && <span className="truncate text-paperdim">{s.remark}</span>}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {children.filter((c) => c.name).length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] tracking-widest text-paperdim/70">{t('snapshot.children')}</p>
              <ul className="space-y-1.5">
                {children
                  .filter((c) => c.name)
                  .map((c, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="font-semibold tracking-widest text-paper">{c.name}</span>
                      {c.gender && <span className="text-paperdim/70">{c.gender}</span>}
                      {(c.whereabouts || c.remark) && (
                        <span className="truncate text-paperdim">{c.whereabouts ?? ''}{c.whereabouts && c.remark ? ' · ' : ''}{c.remark ?? ''}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </PreviewSection>
      )}

      {/* 居住地 */}
      {residences.filter((r) => r.place).length > 0 && (
        <PreviewSection title={t('snapshot.residences')} en="RESIDENCES">
          <ol className="relative ml-1 space-y-3 border-l border-bronze/50 pl-4">
            {residences
              .filter((r) => r.place)
              .map((r, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border-2 border-bronze bg-ink" />
                  <p className="text-xs tracking-widest text-paper">
                    {r.place}
                    {r.period && <span className="ml-2 font-garamond text-[11px] text-bronzelight">{r.period}</span>}
                  </p>
                  {r.remark && <p className="mt-0.5 text-[10px] text-paperdim">{r.remark}</p>}
                </li>
              ))}
          </ol>
        </PreviewSection>
      )}

      {/* 照片 */}
      {photos.length > 0 && (
        <PreviewSection title={t('snapshot.photosAndEvidence')} en="PHOTOGRAPHS">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-sm border border-paperedge/15">
                <img src={photoUrl(p)} alt="" className="aspect-square w-full object-cover" />
                {p.caption && <span className="block truncate bg-inkcard px-1.5 py-1 text-[10px] text-paperdim">{p.caption}</span>}
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* 罪证 */}
      {evidences.length > 0 && (
        <PreviewSection title={t('snapshot.evidence')} en="EVIDENCE">
          <ul className="space-y-2">
            {evidences.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 rounded-sm border border-paperedge/15 p-2.5">
                {ev.fileType.startsWith('image') ? (
                  <img src={photoUrl(ev)} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-garamond text-sm text-bronzelight">
                    文
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-paper">{ev.caption || ev.fileType}</p>
                </div>
                <a href={photoUrl(ev)} target="_blank" rel="noreferrer" className="btn-ghost !px-2 !py-1 text-[10px]">
                  {t('common.view')}
                </a>
              </li>
            ))}
          </ul>
        </PreviewSection>
      )}

      {/* 史料来源 */}
      {sources.filter((s) => s.citation).length > 0 && (
        <PreviewSection title={t('snapshot.references')} en="REFERENCES">
          <ol className="space-y-1.5">
            {sources
              .filter((s) => s.citation)
              .map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="font-garamond text-bronzelight">[{i + 1}]</span>
                  <span className="flex-1 leading-relaxed text-paper/85">{s.citation}</span>
                  {typeof s.credibility === 'number' && (
                    <span className="shrink-0 font-garamond text-[10px] text-bronzelight">
                      {'★'.repeat(s.credibility)}
                    </span>
                  )}
                </li>
              ))}
          </ol>
        </PreviewSection>
      )}

      {/* 相关人物 */}
      {relatedIds.length > 0 && (
        <PreviewSection title={t('traitorEditor.related')} en="RELATED FIGURES">
          <div className="flex flex-wrap gap-1.5">
            {relatedIds.map((rid) => {
              const cand = candidates.find((c) => c.id === rid)
              return (
                <span key={rid} className="badge border-paperedge/30 py-1 text-[11px] text-paperdim">
                  {cand?.name ?? rid}
                  <span className="ml-1.5 text-[10px] text-bronzelight">{cand?.period ?? ''}</span>
                </span>
              )
            })}
          </div>
        </PreviewSection>
      )}

      <p className="mt-6 text-center text-[10px] tracking-widest text-paperdim/50">
        {t('traitorEditor.previewHint')}
      </p>
    </div>
  )
}

export default function TraitorEditor({ mode }: { mode: 'create' | 'edit' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const me = useAuth((s) => s.user)
  const clear = useAuth((s) => s.clear)

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const aiQuery = useAiQuery()
  const [photoAiOnly, setPhotoAiOnly] = useState(false)
  const [aiUploading, setAiUploading] = useState(false)

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

  function fillFromResult(ai: AiTraitorResult) {
    const n = normalizeAiResult(ai)
    setForm((f) => ({ ...f, ...n.form }))
    spouseCtl.setAll(n.spouses)
    childCtl.setAll(n.children)
    crimeCtl.setAll(n.crimeRecords)
    lifeCtl.setAll(n.lifeEvents)
    flash(n.photoNote ? `${t('aiQuery.applied')} ${n.photoNote}` : t('aiQuery.applied'))
  }

  const handleAiReady = (ai: AiTraitorResult) => {
    fillFromResult(ai)
    aiQuery.close()
  }

  const openAiQuery = (photoOnly: boolean) => {
    setPhotoAiOnly(photoOnly)
    void aiQuery.run(form.name)
  }

  const originalAi = useMemo<NormalizedAi | null>(
    () =>
      mode === 'edit'
        ? {
            form: {
              name: form.name,
              courtesyName: form.courtesyName,
              pseudonym: form.pseudonym,
              birthYear: form.birthYear,
              deathYear: form.deathYear,
              birthYearType: form.birthYearType,
              deathYearType: form.deathYearType,
              nativePlace: form.nativePlace,
              birthPlace: form.birthPlace,
              period: form.period,
              faction: form.faction,
              summary: form.summary,
              aliasesText: form.aliasesText,
              identityTagsText: form.identityTagsText,
            },
            spouses,
            children,
            crimeRecords,
            lifeEvents,
            photoNote: '',
          }
        : null,
    [mode, form, spouses, children, crimeRecords, lifeEvents],
  )

  const handleAiUploadPhoto = async (url: string) => {
    setAiUploading(true)
    setError('')
    try {
      const att = await api.uploadFromUrl(url, 'photo')
      setAttachments((a) => [...a, att])
      aiQuery.close()
      setPhotoAiOnly(false)
      flash(t('aiQuery.photoUploaded'))
    } catch (e) {
      flash(e instanceof Error ? e.message : t('common.uploadFailed'))
    } finally {
      setAiUploading(false)
    }
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

  if (loading) return <div className="min-h-screen pt-24"><div className="container-page py-24 text-center text-paperdim">{t('common.loading')}</div></div>

  return (
    <div className="min-h-screen">
      {/* 独立页顶栏（不含侧边菜单） */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-paperedge/15 bg-ink/85 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/traitors/list')}
          className="flex items-center gap-2 text-xs tracking-[0.2em] text-bronzelight/80 transition hover:text-paper"
        >
          <span aria-hidden="true">←</span>
          {t('traitors.title')}
        </button>
        <span className="hidden items-center gap-2 text-xs tracking-[0.2em] text-bronzelight/80 sm:flex">
          {t('layout.brand')}
        </span>
        <div className="flex items-center gap-4">
          {me && (
            <span className="hidden items-center gap-2 text-sm text-paper md:flex">
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-bronze/50 bg-bronze/15 font-song text-sm font-bold text-bronzelight">
                {me.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm">{me.username}</span>
                <span className="text-[11px] tracking-[0.2em] text-bronzelight">{ROLE_LABELS[me.role]}</span>
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              clear()
              navigate('/login', { replace: true })
            }}
            className="btn-ghost !px-3 !py-1.5 text-xs"
          >
            {t('header.logout')}
          </button>
        </div>
      </header>

      <div className="container-page max-w-7xl py-10 pt-24">
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn-ghost !px-4 !py-2 text-xs !text-bronzelight"
            onClick={() => setPreviewOpen(true)}
          >
            {t('traitorEditor.preview')}
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              className="btn-ghost !px-3 !py-2 text-xs !text-bronzelight"
              onClick={() => openAiQuery(false)}
              disabled={!form.name.trim()}
            >
              {t('aiQuery.queryAction')}
            </button>
          )}
        </div>
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
                rows={25}
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
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs tracking-widest text-paperdim">{t('traitorEditor.photo')}</p>
                {mode === 'edit' && (
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 text-xs !text-bronzelight"
                    onClick={() => openAiQuery(true)}
                    disabled={!form.name.trim()}
                  >
                    {t('aiQuery.queryAction')}
                  </button>
                )}
              </div>
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

        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => (mode === 'edit' ? navigate('/traitors/list') : navigate(-1))} className="btn-ghost">
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-primary min-w-36" disabled={busy || uploading}>
            {busy ? t('common.saveInProgress') : mode === 'create' ? t('traitorEditor.saveDraft') : t('traitorEditor.saveChanges')}
          </button>
        </div>
      </form>

      {/* 预览弹框 */}
      <Modal
        open={previewOpen}
        title={t('traitorEditor.preview')}
        hideFooter
        widthClassName="max-w-4xl"
        onClose={() => setPreviewOpen(false)}
      >
        <PreviewPane
          form={form}
          spouses={spouses}
          children={children}
          residences={residences}
          crimeRecords={crimeRecords}
          lifeEvents={lifeEvents}
          sources={sources}
          attachments={attachments}
          relatedIds={relatedIds}
          candidates={candidates}
        />
      </Modal>

      <AiQueryModal
        open={aiQuery.open}
        name={aiQuery.name}
        loading={aiQuery.loading}
        error={aiQuery.error}
        result={aiQuery.result}
        photoOnly={photoAiOnly}
        original={originalAi}
        uploadingPhoto={aiUploading}
        onUploadPhoto={(url) => void handleAiUploadPhoto(url)}
        onClose={() => {
          aiQuery.close()
          setPhotoAiOnly(false)
        }}
        onRetry={() => aiQuery.retry()}
        onFill={handleAiReady}
      />
      </div>

      {/* 页脚 */}
      <footer className="flex-shrink-0 border-t border-paperedge/15 bg-inksoft/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs tracking-wider text-paperdim/70 sm:flex-row">
          <span>{t('layout.title')}</span>
          <span className="font-garamond italic">Editorial Console · Est. 2026</span>
        </div>
      </footer>
    </div>
  )
}
