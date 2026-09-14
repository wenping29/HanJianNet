import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { api } from '../lib/api'
import { formatLifeSpan } from '../lib/format'
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
  onFill: () => void
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

/** 原档案/AI 结果对比的两栏面板：左侧原数据，右侧新数据。 */
function ComparePanel({ title, accent, children }: { title: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`rounded-sm border p-3 ${accent ? 'border-bronze/40' : 'border-paperedge/15'}`}>
      <p
        className={`mb-2 border-b border-paperedge/10 pb-1.5 text-xs font-semibold tracking-[0.2em] ${
          accent ? 'text-bronzelight' : 'text-paperdim/70'
        }`}
      >
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function CompareItem({ label, value, diff }: { label: string; value: React.ReactNode; diff?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 text-sm ${
        diff ? 'rounded-sm bg-bronze/15 px-1.5 py-0.5' : ''
      }`}
    >
      <span className="shrink-0 text-xs tracking-widest text-paperdim/60">{label}</span>
      <span className={`min-w-0 text-right ${diff ? 'font-medium text-bronzelight' : 'text-paper'}`}>{value}</span>
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

  useEffect(() => {
    if (open) setSelectedUrl('')
  }, [open, result])

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
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ComparePanel title={t('aiQuery.originalColumn')}>
                <CompareItem label={t('common.name')} value={original?.form.name || t('aiQuery.empty')} />
                <CompareItem
                  label={t('common.courtesyName')}
                  value={original?.form.courtesyName || t('aiQuery.empty')}
                />
                <CompareItem
                  label={t('common.pseudonym')}
                  value={original?.form.pseudonym || t('aiQuery.empty')}
                />
                <CompareItem
                  label={t('common.lifespan')}
                  value={
                    original?.form.birthYear || original?.form?.deathYear
                      ? formatLifeSpan(toYear(original?.form.birthYear ?? ''), toYear(original?.form.deathYear ?? ''), original?.form.birthYearType ?? 'unknown', original?.form.deathYearType ?? 'unknown')
                      : t('aiQuery.empty')
                  }
                />
                <CompareItem
                  label={t('common.nativePlace')}
                  value={original?.form.nativePlace || t('aiQuery.empty')}
                />
                <CompareItem
                  label={t('common.birthPlace')}
                  value={original?.form.birthPlace || t('aiQuery.empty')}
                />
                <CompareItem label={t('common.period')} value={original?.form.period || t('aiQuery.empty')} />
                <CompareItem label={t('common.faction')} value={original?.form.faction || t('aiQuery.empty')} />
                <CompareItem
                  label={t('common.aliases')}
                  value={original?.form.aliasesText || t('aiQuery.empty')}
                />
                <CompareItem
                  label={t('common.identityTags')}
                  value={original?.form.identityTagsText || t('aiQuery.empty')}
                />
              </ComparePanel>
              <ComparePanel title={t('aiQuery.aiColumn')} accent>
                <CompareItem
                  label={t('common.name')}
                  value={result.name || t('aiQuery.empty')}
                  diff={diffText(result.name, original?.form.name)}
                />
                <CompareItem
                  label={t('common.courtesyName')}
                  value={result.courtesyName || t('aiQuery.empty')}
                  diff={diffText(result.courtesyName, original?.form.courtesyName)}
                />
                <CompareItem
                  label={t('common.pseudonym')}
                  value={result.pseudonym || t('aiQuery.empty')}
                  diff={diffText(result.pseudonym, original?.form.pseudonym)}
                />
                <CompareItem
                  label={t('common.lifespan')}
                  value={formatLifeSpan(result.birthYear, result.deathYear, result.birthYearType, result.deathYearType)}
                  diff={diffText(
                    formatLifeSpan(result.birthYear, result.deathYear, result.birthYearType, result.deathYearType),
                    original?.form.birthYear || original?.form.deathYear
                      ? formatLifeSpan(toYear(original?.form.birthYear ?? ''), toYear(original?.form.deathYear ?? ''), original?.form.birthYearType ?? 'unknown', original?.form.deathYearType ?? 'unknown')
                      : '',
                  )}
                />
                <CompareItem
                  label={t('common.nativePlace')}
                  value={result.nativePlace || t('aiQuery.empty')}
                  diff={diffText(result.nativePlace, original?.form.nativePlace)}
                />
                <CompareItem
                  label={t('common.birthPlace')}
                  value={result.birthPlace || t('aiQuery.empty')}
                  diff={diffText(result.birthPlace, original?.form.birthPlace)}
                />
                <CompareItem
                  label={t('common.period')}
                  value={result.period || t('aiQuery.empty')}
                  diff={diffText(result.period, original?.form.period)}
                />
                <CompareItem
                  label={t('common.faction')}
                  value={result.faction || t('aiQuery.empty')}
                  diff={diffText(result.faction, original?.form.faction)}
                />
                <CompareItem
                  label={t('common.aliases')}
                  value={(result.aliases ?? []).join('、') || t('aiQuery.empty')}
                  diff={diffText((result.aliases ?? []).join('、'), original?.form.aliasesText)}
                />
                <CompareItem
                  label={t('common.identityTags')}
                  value={(result.identityTags ?? []).join('、') || t('aiQuery.empty')}
                  diff={diffText((result.identityTags ?? []).join('、'), original?.form.identityTagsText)}
                />
              </ComparePanel>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('common.summary')}
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ComparePanel title={t('aiQuery.originalColumn')}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper">
                  {original?.form.summary || t('aiQuery.empty')}
                </p>
              </ComparePanel>
              <ComparePanel title={t('aiQuery.aiColumn')} accent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-paper">
                  {result.summary || t('aiQuery.empty')}
                </p>
              </ComparePanel>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.crimes')}
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ComparePanel title={t('aiQuery.originalColumn')}>
                {(original?.crimeRecords ?? []).length > 0 ? (
                  <ul className="space-y-2">
                    {(original?.crimeRecords ?? []).map((c, i) => (
                      <li key={i} className="rounded-sm border border-paperedge/10 p-2 text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="font-garamond text-xs text-bronzelight">{c.year ?? ''}</span>
                          <span className="font-medium text-paper">{c.title}</span>
                        </div>
                        {c.process && <p className="mt-1 text-paperdim">{c.process}</p>}
                        {c.harm && <p className="mt-1 text-paperdim/80">{c.harm}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                )}
              </ComparePanel>
              <ComparePanel title={t('aiQuery.aiColumn')} accent>
                {(result.crimeRecords ?? []).length > 0 ? (
                  <ul className="space-y-2">
                    {result.crimeRecords.map((c, i) => (
                      <li key={i} className="rounded-sm border border-paperedge/10 p-2 text-sm">
                        <div className="flex items-baseline gap-2">
                          <span className="font-garamond text-xs text-bronzelight">{c.year ?? ''}</span>
                          <span className="font-medium text-paper">{c.title}</span>
                        </div>
                        {c.process && <p className="mt-1 text-paperdim">{c.process}</p>}
                        {c.harm && <p className="mt-1 text-paperdim/80">{c.harm}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                )}
              </ComparePanel>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.family')}
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ComparePanel title={t('aiQuery.originalColumn')}>
                <CompareItem
                  label={t('traitorEditor.spouse')}
                  value={joinList(original?.spouses ?? [], (s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`) || t('aiQuery.empty')}
                />
                <CompareItem
                  label={t('traitorEditor.children')}
                  value={joinList(original?.children ?? [], (c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`) || t('aiQuery.empty')}
                />
              </ComparePanel>
              <ComparePanel title={t('aiQuery.aiColumn')} accent>
                <CompareItem
                  label={t('traitorEditor.spouse')}
                  value={(result.spouses ?? []).map((s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`).join('、') || t('aiQuery.empty')}
                  diff={diffText(
                    (result.spouses ?? []).map((s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`).join('、'),
                    joinList(original?.spouses ?? [], (s) => `${s.name}${s.remark ? `（${s.remark}）` : ''}`),
                  )}
                />
                <CompareItem
                  label={t('traitorEditor.children')}
                  value={(result.children ?? []).map((c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`).join('、') || t('aiQuery.empty')}
                  diff={diffText(
                    (result.children ?? []).map((c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`).join('、'),
                    joinList(original?.children ?? [], (c) => `${c.name}${c.gender ? `（${c.gender}）` : ''}`),
                  )}
                />
              </ComparePanel>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('traitorEditor.lifeEvents')}
            </h4>
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ComparePanel title={t('aiQuery.originalColumn')}>
                {(original?.lifeEvents ?? []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {(original?.lifeEvents ?? []).map((l, i) => (
                      <li key={i} className="text-sm text-paper">
                        <span className="mr-2 font-garamond text-xs text-bronzelight">{l.year ?? ''}</span>
                        {l.event}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                )}
              </ComparePanel>
              <ComparePanel title={t('aiQuery.aiColumn')} accent>
                {(result.lifeEvents ?? []).length > 0 ? (
                  <ul className="space-y-1.5">
                    {result.lifeEvents.map((l, i) => (
                      <li key={i} className="text-sm text-paper">
                        <span className="mr-2 font-garamond text-xs text-bronzelight">{l.year ?? ''}</span>
                        {l.event}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-paperdim/60">{t('aiQuery.empty')}</p>
                )}
              </ComparePanel>
            </div>
          </section>

          <p className="rounded-sm border border-bronze/50 bg-bronze/15 px-3 py-2 text-xs text-bronzelight">
            {result.photoNote || t('aiQuery.photoNote')}
          </p>

          <div className="flex justify-end gap-3 border-t border-paperedge/15 pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t('common.close')}
            </button>
            <button type="button" className="btn-primary" onClick={onFill}>
              {t('aiQuery.fillToEditor')}
            </button>
          </div>
        </div>
        )
      ) : null}
    </Modal>
  )
}