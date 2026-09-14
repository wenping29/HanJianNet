import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { api } from '../lib/api'
import { formatLifeSpan } from '../lib/format'
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-baseline gap-2 text-sm">
      <span className="shrink-0 text-xs tracking-widest text-paperdim/70">{label}</span>
      <span className="min-w-0 text-paper">{children}</span>
    </div>
  )
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
            <div className="space-y-1.5">
              <Row label={t('common.name')}>{result.name}</Row>
              <Row label={t('common.courtesyName')}>{result.courtesyName || t('aiQuery.empty')}</Row>
              <Row label={t('common.pseudonym')}>{result.pseudonym || t('aiQuery.empty')}</Row>
              <Row label={t('common.lifespan')}>
                {formatLifeSpan(result.birthYear, result.deathYear, result.birthYearType, result.deathYearType)}
              </Row>
              <Row label={t('common.nativePlace')}>{result.nativePlace || t('aiQuery.empty')}</Row>
              <Row label={t('common.birthPlace')}>{result.birthPlace || t('aiQuery.empty')}</Row>
              <Row label={t('common.period')}>{result.period || t('aiQuery.empty')}</Row>
              <Row label={t('common.faction')}>{result.faction || t('aiQuery.empty')}</Row>
              <Row label={t('common.aliases')}>
                {(result.aliases ?? []).length > 0 ? result.aliases.join('、') : t('aiQuery.empty')}
              </Row>
              <Row label={t('common.identityTags')}>
                {(result.identityTags ?? []).length > 0 ? result.identityTags.join('、') : t('aiQuery.empty')}
              </Row>
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
              {t('common.summary')}
            </h4>
            <p className="whitespace-pre-wrap rounded-sm border border-paperedge/15 bg-inkcard/50 p-3 text-sm leading-relaxed text-paper">
              {result.summary || t('aiQuery.empty')}
            </p>
          </section>

          {(result.crimeRecords ?? []).length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
                {t('traitorEditor.crimes')}
              </h4>
              <ul className="space-y-2">
                {result.crimeRecords.map((c, i) => (
                  <li key={i} className="rounded-sm border border-paperedge/15 p-3 text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="font-garamond text-xs text-bronzelight">{c.year ?? ''}</span>
                      <span className="font-medium text-paper">{c.title}</span>
                    </div>
                    {c.process && <p className="mt-1 text-paperdim">{c.process}</p>}
                    {c.harm && <p className="mt-1 text-paperdim/80">{c.harm}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(result.spouses ?? []).length > 0 || (result.children ?? []).length > 0 ? (
            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
                {t('traitorEditor.family')}
              </h4>
              {(result.spouses ?? []).length > 0 && (
                <div className="space-y-1.5">
                  <Row label={t('traitorEditor.spouse')}>
                    {result.spouses.map((s, i) => (
                      <span key={i}>{s.name}{s.remark ? `（${s.remark}）` : ''}</span>
                    ))}
                  </Row>
                </div>
              )}
              {(result.children ?? []).length > 0 && (
                <div className="space-y-1.5">
                  <Row label={t('traitorEditor.children')}>
                    {result.children.map((c, i) => (
                      <span key={i}>{c.name}{c.gender ? `（${c.gender}）` : ''}</span>
                    ))}
                  </Row>
                </div>
              )}
            </section>
          ) : null}

          {(result.lifeEvents ?? []).length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">
                {t('traitorEditor.lifeEvents')}
              </h4>
              <ul className="space-y-1.5">
                {result.lifeEvents.map((l, i) => (
                  <li key={i} className="text-sm text-paperdim">
                    <span className="mr-2 font-garamond text-xs text-bronzelight">{l.year ?? ''}</span>
                    {l.event}
                  </li>
                ))}
              </ul>
            </section>
          )}

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