import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { api } from '../lib/api'
import { formatLifeSpan, splitList } from '../lib/format'
import type { NormalizedAi } from '../lib/ai'
import type { AiPhoto, AiTraitorResult } from '../types'

/** 管理 AI 查询弹窗状态（加载/结果/错误/重试） */
export function useAiQuery() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiTraitorResult | null>(null)
  const [error, setError] = useState('')

  const run = useCallback(async (traitorName: string) => {
    setName(traitorName)
    setResult(null)
    setError('')
    setLoading(true)
    setOpen(true)
    try {
      const data = await api.aiQueryTraitor(traitorName)
      setResult(data.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : '')
    } finally {
      setLoading(false)
    }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    setLoading(false)
    setResult(null)
    setError('')
  }, [])

  const retry = useCallback(() => {
    setResult(null)
    setError('')
    setLoading(true)
    void run(name)
  }, [run, name])

  return { open, name, loading, result, error, run, retry, close }
}

interface AiQueryModalProps {
  open: boolean
  name: string
  loading: boolean
  error: string
  result: AiTraitorResult | null
  onClose: () => void
  onRetry: () => void
  onFill: (ai: AiTraitorResult) => void
  photoOnly?: boolean
  onUploadPhoto?: (url: string) => void
  uploadingPhoto?: boolean
  /** 当前档案原始数据（用于与 AI 查询结果逐项对比） */
  original?: NormalizedAi | null
}

function PhotoThumb({ photo }: { photo: AiPhoto }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="w-full overflow-hidden rounded-sm border border-paperedge/15 bg-inkcard/50">
      {failed ? (
        <div className="flex h-28 w-full items-center justify-center text-xs text-paperdim/50">✕</div>
      ) : (
        <img src={photo.url} alt="" loading="lazy" className="h-28 w-full object-cover" onError={() => setFailed(true)} />
      )}
      <div className="space-y-0.5 px-2 py-1.5 text-left">
        {photo.caption && <p className="line-clamp-1 text-xs text-paper">{photo.caption}</p>}
        {photo.source && <p className="line-clamp-1 text-[10px] text-paperdim/60">{photo.source}</p>}
      </div>
    </div>
  )
}

function diffText(ai: unknown, orig: unknown): boolean {
  const a = Array.isArray(ai) ? ai.join('，') : String(ai ?? '').trim()
  const b = Array.isArray(orig) ? orig.join('，') : String(orig ?? '').trim()
  return a.replace(/\s+/g, '') !== b.replace(/\s+/g, '')
}

function joinList<T>(items: T[], fmt: (v: T) => string): string {
  return items.map(fmt).filter(Boolean).join('、')
}

function toYear(v: string): number | null {
  if (!v) return null
  const n = Number(v)
  return Number.isNaN(n) || n <= 0 ? null : n
}

type FieldKey =
  | 'name'
  | 'courtesyName'
  | 'pseudonym'
  | 'lifespan'
  | 'nativePlace'
  | 'birthPlace'
  | 'period'
  | 'faction'
  | 'aliases'
  | 'identityTags'

const ALL_FIELDS: FieldKey[] = [
  'name',
  'courtesyName',
  'pseudonym',
  'lifespan',
  'nativePlace',
  'birthPlace',
  'period',
  'faction',
  'aliases',
  'identityTags',
]

interface ReplaceSelections {
  fields: Record<FieldKey, boolean>
  summary: boolean
  crimeItems: boolean[]
  lifeItems: boolean[]
  spouse: boolean
  child: boolean
}

/** 逐项替换选择：未被勾选的项沿用原档案数据，勾选项用 AI 结果覆盖 */
function buildMerged(sel: ReplaceSelections, result: AiTraitorResult, original: NormalizedAi | null): AiTraitorResult {
  const o = original?.form
  const ai = result
  const lifespanReplaced = sel.fields.lifespan
  const origYear = (v: string | undefined, fallback: number | null | undefined) =>
    v && toYear(v) !== null ? toYear(v) : fallback ?? null

  const mergeList = <T,>(aiItems: T[], origItems: T[] | undefined, checked: boolean[]): T[] => {
    const out: T[] = []
    const len = Math.max(aiItems.length, origItems?.length ?? 0)
    for (let i = 0; i < len; i++) {
      if (checked[i] && aiItems[i]) out.push(aiItems[i])
      else if (origItems?.[i]) out.push(origItems[i])
    }
    return out
  }

  return {
    name: sel.fields.name ? (ai.name ?? '') : (o?.name || ai.name || ''),
    courtesyName: sel.fields.courtesyName ? (ai.courtesyName ?? '') : (o?.courtesyName || ai.courtesyName || ''),
    pseudonym: sel.fields.pseudonym ? (ai.pseudonym ?? '') : (o?.pseudonym || ai.pseudonym || ''),
    birthYear: lifespanReplaced ? (ai.birthYear ?? null) : origYear(o?.birthYear, ai.birthYear),
    deathYear: lifespanReplaced ? (ai.deathYear ?? null) : origYear(o?.deathYear, ai.deathYear),
    birthYearType: lifespanReplaced
      ? (ai.birthYearType ?? 'unknown')
      : ((o?.birthYearType ?? ai.birthYearType) as AiTraitorResult['birthYearType']),
    deathYearType: lifespanReplaced
      ? (ai.deathYearType ?? 'unknown')
      : ((o?.deathYearType ?? ai.deathYearType) as AiTraitorResult['deathYearType']),
    nativePlace: sel.fields.nativePlace ? (ai.nativePlace ?? '') : (o?.nativePlace || ai.nativePlace || ''),
    birthPlace: sel.fields.birthPlace ? (ai.birthPlace ?? '') : (o?.birthPlace || ai.birthPlace || ''),
    period: sel.fields.period ? (ai.period ?? '') : (o?.period || ai.period || ''),
    faction: sel.fields.faction ? (ai.faction ?? '') : (o?.faction || ai.faction || ''),
    summary: sel.summary ? (ai.summary ?? '') : (o?.summary || ai.summary || ''),
    aliases: sel.fields.aliases
      ? (ai.aliases ?? [])
      : (o?.aliasesText ? splitList(o.aliasesText) : (ai.aliases ?? [])),
    identityTags: sel.fields.identityTags
      ? (ai.identityTags ?? [])
      : (o?.identityTagsText ? splitList(o.identityTagsText) : (ai.identityTags ?? [])),
    spouses: sel.spouse ? (ai.spouses ?? []) : (original?.spouses ?? ai.spouses ?? []),
    children: sel.child ? (ai.children ?? []) : (original?.children ?? ai.children ?? []),
    crimeRecords: mergeList(ai.crimeRecords ?? [], original?.crimeRecords, sel.crimeItems),
    lifeEvents: mergeList(ai.lifeEvents ?? [], original?.lifeEvents, sel.lifeItems),
    photoNote: ai.photoNote ?? '',
  }
}

/** 原档案/AI 结果对比的两栏面板：左侧原数据，右侧新数据。 */
function ReplaceCheck({ checked, onToggle }: { checked?: boolean; onToggle?: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 accent-cinnabar"
      checked={!!checked}
      onChange={(e) => onToggle?.(e.target.checked)}
    />
  )
}

function CompareGridHead({ withLabel }: { withLabel?: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      className={`grid items-center gap-3 rounded-sm border border-paperedge/15 px-3 py-2 text-xs tracking-widest text-paperdim/70 ${
        withLabel ? 'grid-cols-[120px_1fr_1fr_64px]' : 'grid-cols-[1fr_1fr_64px]'
      }`}
    >
      {withLabel && <span>{t('aiQuery.fieldColumn')}</span>}
      <span>{t('aiQuery.originalColumn')}</span>
      <span>{t('aiQuery.aiColumn')}</span>
      <span className="text-center">{t('aiQuery.replaceCheck')}</span>
    </div>
  )
}

function FieldRow({
  label,
  orig,
  ai,
  diff,
  checked,
  onToggle,
}: {
  label: string
  orig?: string
  ai: string
  diff: boolean
  checked: boolean
  onToggle: (v: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-[120px_1fr_1fr_64px] items-center gap-x-3 border-b border-paperedge/5 px-3 py-1.5">
      <span className="text-xs tracking-widest text-paperdim/60">{label}</span>
      <span className="min-w-0 text-sm text-paperdim">{orig?.trim() || t('aiQuery.empty')}</span>
      <span className={`min-w-0 text-sm ${diff ? 'font-medium text-bronzelight' : 'text-paper'}`}>
        {ai.trim() || t('aiQuery.empty')}
      </span>
      <span className="justify-self-center">
        <ReplaceCheck checked={checked} onToggle={onToggle} />
      </span>
    </div>
  )
}

function ListRow({
  orig,
  ai,
  checked,
  onToggle,
}: {
  orig: React.ReactNode
  ai: React.ReactNode
  checked: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_64px] items-center gap-3 border-b border-paperedge/5 py-1.5">
      <div className="min-w-0">{orig}</div>
      <div className="min-w-0">{ai}</div>
      <span className="justify-self-center">
        <ReplaceCheck checked={checked} onToggle={onToggle} />
      </span>
    </div>
  )
}

export default function AiQueryModal({
  open,
  name,
  loading,
  error,
  result,
  onClose,
  onRetry,
  onFill,
  photoOnly = false,
  onUploadPhoto,
  uploadingPhoto = false,
  original = null,
}: AiQueryModalProps) {
  const { t } = useTranslation()
  const [selectedUrl, setSelectedUrl] = useState('')
  const [sel, setSel] = useState<ReplaceSelections | null>(null)

  useEffect(() => {
    if (open) setSelectedUrl('')
  }, [open, result])

  useEffect(() => {
    if (open && result) {
      setSel({
        fields: ALL_FIELDS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<FieldKey, boolean>),
        summary: true,
        crimeItems: (result.crimeRecords ?? []).map(() => true),
        lifeItems: (result.lifeEvents ?? []).map(() => true),
        spouse: true,
        child: true,
      })
    }
  }, [open, result])

  const setField = (k: FieldKey, v: boolean) => setSel((s) => (s ? { ...s, fields: { ...s.fields, [k]: v } } : s))
  const setIndex = (list: 'crimeItems' | 'lifeItems', i: number, v: boolean) =>
    setSel((s) => (s ? { ...s, [list]: s[list].map((c, idx) => (idx === i ? v : c)) } : s))

  const handleFill = () => {
    if (!sel || !result) return
    onFill(buildMerged(sel, result, original))
  }

  return (
    <Modal open={open} title={t('aiQuery.queryTitle', { name })} hideFooter onClose={onClose}>
      {loading ? (
        <div className="py-10 text-center text-sm text-paperdim">{t('aiQuery.querying')}</div>
      ) : error ? (
        <div className="py-6">
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
            {t('aiQuery.queryFailed')}：{error}
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t('common.close')}
            </button>
            <button type="button" className="btn-primary" onClick={onRetry}>
              {t('aiQuery.retry')}
            </button>
          </div>
        </div>
      ) : result ? (
        photoOnly ? (
          <div className="space-y-4">
            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
                {t('traitorEditor.photo')}
              </h4>
              {(result.photos ?? []).length > 0 ? (
                <>
                  <p className="mb-2 text-xs text-paperdim/70">{t('aiQuery.selectPhoto')}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {(result.photos ?? []).map((p) => (
                      <button
                        type="button"
                        key={p.url}
                        onClick={() => setSelectedUrl(p.url)}
                        className={`rounded-sm border transition ${
                          selectedUrl === p.url
                            ? 'border-bronzelight shadow-seal'
                            : 'border-paperedge/15 hover:border-bronze/50'
                        }`}
                      >
                        <PhotoThumb photo={p} />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="whitespace-pre-wrap rounded-sm border border-paperedge/15 bg-inkcard/50 p-3 text-sm leading-relaxed text-paper">
                  {t('aiQuery.noPhotoFound')}
                </p>
              )}
              {result.photoNote && (
                <p className="mt-3 rounded-sm border border-bronze/50 bg-bronze/15 px-3 py-2 text-xs text-bronzelight">
                  {result.photoNote}
                </p>
              )}
            </section>
            <div className="flex items-center justify-between gap-3 border-t border-paperedge/15 pt-4">
              <p className="min-w-0 truncate text-xs text-paperdim/70">
                {selectedUrl ? t('aiQuery.photoSelected') : t('aiQuery.selectPhotoHint')}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  {t('common.close')}
                </button>
                {onUploadPhoto && (
                  <button
                    type="button"
                    className="btn-primary min-w-28"
                    disabled={!selectedUrl || uploadingPhoto}
                    onClick={() => selectedUrl && onUploadPhoto(selectedUrl)}
                  >
                    {uploadingPhoto ? t('common.saveInProgress') : t('aiQuery.uploadPhoto')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
        <div className="space-y-6">
          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.basicInfo')}
            </h4>
            <div className="mt-2 overflow-x-auto">
              <div className="min-w-[608px]">
                <CompareGridHead withLabel />
                <FieldRow
                  label={t('common.name')}
                  orig={original?.form.name}
                  ai={result.name ?? ''}
                  diff={diffText(result.name, original?.form.name)}
                  checked={!!sel?.fields.name}
                  onToggle={(v) => setField('name', v)}
                />
                <FieldRow
                  label={t('common.courtesyName')}
                  orig={original?.form.courtesyName}
                  ai={result.courtesyName ?? ''}
                  diff={diffText(result.courtesyName, original?.form.courtesyName)}
                  checked={!!sel?.fields.courtesyName}
                  onToggle={(v) => setField('courtesyName', v)}
                />
                <FieldRow
                  label={t('common.pseudonym')}
                  orig={original?.form.pseudonym}
                  ai={result.pseudonym ?? ''}
                  diff={diffText(result.pseudonym, original?.form.pseudonym)}
                  checked={!!sel?.fields.pseudonym}
                  onToggle={(v) => setField('pseudonym', v)}
                />
                <FieldRow
                  label={t('common.lifespan')}
                  orig={
                    original?.form.birthYear || original?.form?.deathYear
                      ? formatLifeSpan(
                          toYear(original?.form.birthYear ?? ''),
                          toYear(original?.form.deathYear ?? ''),
                          original?.form.birthYearType ?? 'unknown',
                          original?.form.deathYearType ?? 'unknown',
                        )
                      : ''
                  }
                  ai={formatLifeSpan(result.birthYear, result.deathYear, result.birthYearType, result.deathYearType)}
                  diff={diffText(
                    formatLifeSpan(result.birthYear, result.deathYear, result.birthYearType, result.deathYearType),
                    original?.form.birthYear || original?.form?.deathYear
                      ? formatLifeSpan(
                          toYear(original?.form.birthYear ?? ''),
                          toYear(original?.form.deathYear ?? ''),
                          original?.form.birthYearType ?? 'unknown',
                          original?.form.deathYearType ?? 'unknown',
                        )
                      : '',
                  )}
                  checked={!!sel?.fields.lifespan}
                  onToggle={(v) => setField('lifespan', v)}
                />
                <FieldRow
                  label={t('common.nativePlace')}
                  orig={original?.form.nativePlace}
                  ai={result.nativePlace ?? ''}
                  diff={diffText(result.nativePlace, original?.form.nativePlace)}
                  checked={!!sel?.fields.nativePlace}
                  onToggle={(v) => setField('nativePlace', v)}
                />
                <FieldRow
                  label={t('common.birthPlace')}
                  orig={original?.form.birthPlace}
                  ai={result.birthPlace ?? ''}
                  diff={diffText(result.birthPlace, original?.form.birthPlace)}
                  checked={!!sel?.fields.birthPlace}
                  onToggle={(v) => setField('birthPlace', v)}
                />
                <FieldRow
                  label={t('common.period')}
                  orig={original?.form.period}
                  ai={result.period ?? ''}
                  diff={diffText(result.period, original?.form.period)}
                  checked={!!sel?.fields.period}
                  onToggle={(v) => setField('period', v)}
                />
                <FieldRow
                  label={t('common.faction')}
                  orig={original?.form.faction}
                  ai={result.faction ?? ''}
                  diff={diffText(result.faction, original?.form.faction)}
                  checked={!!sel?.fields.faction}
                  onToggle={(v) => setField('faction', v)}
                />
                <FieldRow
                  label={t('common.aliases')}
                  orig={original?.form.aliasesText}
                  ai={(result.aliases ?? []).join('、')}
                  diff={diffText((result.aliases ?? []).join('、'), original?.form.aliasesText)}
                  checked={!!sel?.fields.aliases}
                  onToggle={(v) => setField('aliases', v)}
                />
                <FieldRow
                  label={t('common.identityTags')}
                  orig={original?.form.identityTagsText}
                  ai={(result.identityTags ?? []).join('、')}
                  diff={diffText((result.identityTags ?? []).join('、'), original?.form.identityTagsText)}
                  checked={!!sel?.fields.identityTags}
                  onToggle={(v) => setField('identityTags', v)}
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">{t('common.summary')}</h4>
            <div className="mt-2 overflow-x-auto">
              <div className="min-w-[560px]">
                <CompareGridHead />
                <ListRow
                  orig={
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper">
                      {original?.form.summary || t('aiQuery.empty')}
                    </p>
                  }
                  ai={
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper">
                      {result.summary || t('aiQuery.empty')}
                    </p>
                  }
                  checked={!!sel?.summary}
                  onToggle={(v) => setSel((s) => (s ? { ...s, summary: v } : s))}
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.crimes')}
            </h4>
            <div className="mt-2 overflow-x-auto">
              <div className="min-w-[560px]">
                <CompareGridHead />
                {Array.from({
                  length: Math.max((result.crimeRecords ?? []).length, original?.crimeRecords?.length ?? 0),
                }).map((_, i) => {
                  const oc = (original?.crimeRecords ?? [])[i]
                  const ac = (result.crimeRecords ?? [])[i]
                  return (
                    <ListRow
                      key={i}
                      orig={
                        oc ? (
                          <div className="rounded-sm border border-paperedge/10 p-2 text-sm">
                            <div className="flex items-baseline gap-2">
                              <span className="font-garamond text-xs text-bronzelight">{oc.year ?? ''}</span>
                              <span className="font-medium text-paper">{oc.title}</span>
                            </div>
                            {oc.process && <p className="mt-1 text-paperdim">{oc.process}</p>}
                            {oc.harm && <p className="mt-1 text-paperdim/80">{oc.harm}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                        )
                      }
                      ai={
                        ac ? (
                          <div className="rounded-sm border border-bronze/30 p-2 text-sm">
                            <div className="flex items-baseline gap-2">
                              <span className="font-garamond text-xs text-bronzelight">{ac.year ?? ''}</span>
                              <span className="font-medium text-paper">{ac.title}</span>
                            </div>
                            {ac.process && <p className="mt-1 text-paperdim">{ac.process}</p>}
                            {ac.harm && <p className="mt-1 text-paperdim/80">{ac.harm}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                        )
                      }
                      checked={!!sel?.crimeItems[i]}
                      onToggle={(v) => setIndex('crimeItems', i, v)}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.family')}
            </h4>
            <div className="mt-2 overflow-x-auto">
              <div className="min-w-[560px]">
                <CompareGridHead />
                <ListRow
                  orig={
                    <p className="text-sm text-paper">
                      {joinList(original?.spouses ?? [], (s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`) ||
                        t('aiQuery.empty')}
                    </p>
                  }
                  ai={
                    <p className="text-sm text-paper">
                      {(result.spouses ?? []).map((s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`).join('、') ||
                        t('aiQuery.empty')}
                    </p>
                  }
                  checked={!!sel?.spouse}
                  onToggle={(v) => setSel((s) => (s ? { ...s, spouse: v } : s))}
                />
                <ListRow
                  orig={
                    <p className="text-sm text-paper">
                      {joinList(original?.children ?? [], (c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`) ||
                        t('aiQuery.empty')}
                    </p>
                  }
                  ai={
                    <p className="text-sm text-paper">
                      {(result.children ?? []).map((c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`).join('、') ||
                        t('aiQuery.empty')}
                    </p>
                  }
                  checked={!!sel?.child}
                  onToggle={(v) => setSel((s) => (s ? { ...s, child: v } : s))}
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.lifeEvents')}
            </h4>
            <div className="mt-2 overflow-x-auto">
              <div className="min-w-[560px]">
                <CompareGridHead />
                {Array.from({
                  length: Math.max((result.lifeEvents ?? []).length, original?.lifeEvents?.length ?? 0),
                }).map((_, i) => {
                  const ol = (original?.lifeEvents ?? [])[i]
                  const al = (result.lifeEvents ?? [])[i]
                  return (
                    <ListRow
                      key={i}
                      orig={
                        ol ? (
                          <p className="text-sm text-paper">
                            <span className="mr-2 font-garamond text-xs text-bronzelight">{ol.year ?? ''}</span>
                            {ol.event}
                          </p>
                        ) : (
                          <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                        )
                      }
                      ai={
                        al ? (
                          <p className="text-sm text-paper">
                            <span className="mr-2 font-garamond text-xs text-bronzelight">{al.year ?? ''}</span>
                            {al.event}
                          </p>
                        ) : (
                          <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                        )
                      }
                      checked={!!sel?.lifeItems[i]}
                      onToggle={(v) => setIndex('lifeItems', i, v)}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          <p className="rounded-sm border border-bronze/50 bg-bronze/15 px-3 py-2 text-xs text-bronzelight">
            {result.photoNote || t('aiQuery.photoNote')}
          </p>

          <div className="flex justify-end gap-3 border-t border-paperedge/15 pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t('common.close')}
            </button>
            <button type="button" className="btn-primary" onClick={handleFill}>
              {t('aiQuery.fillToEditor')}
            </button>
          </div>
        </div>
        )
      ) : null}
    </Modal>
  )
}