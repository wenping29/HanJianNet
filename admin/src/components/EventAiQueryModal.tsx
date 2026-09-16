import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { api } from '../lib/api'
import type { AiEventResult, AtrocityEventInput } from '../types'

type FieldKey =
  | 'name'
  | 'alias'
  | 'eventType'
  | 'era'
  | 'year'
  | 'province'
  | 'city'
  | 'location'
  | 'isGeneral'
  | 'personCount'
  | 'keywords'

const ALL_FIELDS: FieldKey[] = [
  'name', 'alias', 'eventType', 'era', 'year',
  'province', 'city', 'location', 'isGeneral', 'personCount', 'keywords',
]

export function useAiEventQuery() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiEventResult | null>(null)
  const [error, setError] = useState('')

  const run = useCallback(async (eventName: string) => {
    setName(eventName)
    setResult(null)
    setError('')
    setLoading(true)
    setOpen(true)
    try {
      const data = await api.aiQueryEvent(eventName)
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

function diffText(ai: unknown, orig: unknown): boolean {
  const a = Array.isArray(ai) ? ai.join('，') : String(ai ?? '').trim()
  const b = Array.isArray(orig) ? orig.join('，') : String(orig ?? '').trim()
  return a.replace(/\s+/g, '') !== b.replace(/\s+/g, '')
}

function toStr(v: unknown, yes: string, no: string): string {
  if (v == null) return ''
  if (typeof v === 'boolean') return v ? yes : no
  return String(v)
}

function get(o: object, k: string): unknown {
  return (o as unknown as Record<string, unknown>)[k]
}

interface EventAiQueryModalProps {
  open: boolean
  name: string
  loading: boolean
  error: string
  result: AiEventResult | null
  onClose: () => void
  onRetry: () => void
  onFill: (ai: Partial<AtrocityEventInput>) => void
  original: AtrocityEventInput
}

type Sel = Record<FieldKey, boolean> & { summary: boolean }

export default function EventAiQueryModal({
  open, name, loading, error, result, onClose, onRetry, onFill, original,
}: EventAiQueryModalProps) {
  const { t } = useTranslation()
  const [sel, setSel] = useState<Sel>({} as Sel)

  useEffect(() => {
    if (open) setSel(() => ALL_FIELDS.reduce((a, k) => ({ ...a, [k]: true }), { summary: true } as Sel))
  }, [open, result])

  const set = (k: keyof Sel, v: boolean) => setSel((s) => ({ ...s, [k]: v }))

  const handleFill = () => {
    if (!result) return
    const filled: Partial<AtrocityEventInput> = {}
    if (sel.name) filled.name = result.name ?? original.name
    if (sel.alias) filled.alias = result.alias ?? original.alias
    if (sel.eventType) filled.eventType = result.eventType ?? original.eventType
    if (sel.era) filled.era = result.era ?? original.era
    if (sel.year) filled.year = result.year ?? original.year
    if (sel.province) filled.province = result.province ?? original.province
    if (sel.city) filled.city = result.city ?? original.city
    if (sel.location) filled.location = result.location ?? original.location
    if (sel.isGeneral) filled.isGeneral = result.isGeneral
    if (sel.personCount) filled.personCount = result.personCount ?? original.personCount
    if (sel.keywords) filled.keywords = result.keywords ?? original.keywords
    if (sel.summary) filled.summary = result.summary ?? original.summary
    onFill(filled)
  }

  return (
    <Modal open={open} title={t('aiQueryEvent.queryTitle', { name })} hideFooter onClose={onClose}>
      {loading ? (
        <div className="py-10 text-center text-sm text-paperdim">{t('aiQueryEvent.querying')}</div>
      ) : error ? (
        <div className="py-6">
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
            {t('aiQueryEvent.queryFailed')}：{error}
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={onClose}>{t('common.close')}</button>
            <button type="button" className="btn-primary" onClick={onRetry}>{t('aiQueryEvent.retry')}</button>
          </div>
        </div>
      ) : result ? (
        <div className="space-y-5">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[120px_1fr_1fr_64px] items-center gap-3 rounded-sm border border-paperedge/15 px-3 py-2 text-xs tracking-widest text-paperdim/70">
                <span>{t('aiQueryEvent.fieldColumn')}</span>
                <span>{t('aiQueryEvent.originalColumn')}</span>
                <span>{t('aiQueryEvent.aiColumn')}</span>
                <span className="text-center">{t('aiQueryEvent.replaceCheck')}</span>
              </div>
              {(ALL_FIELDS.map((k) => (
                <div key={k} className="grid grid-cols-[120px_1fr_1fr_64px] items-center gap-x-3 border-b border-paperedge/5 px-3 py-1.5">
                  <span className="text-xs tracking-widest text-paperdim/60">{t(`eventsAdmin.form.${k}`)}</span>
                  <span className="min-w-0 text-sm text-paperdim">{toStr(get(original, k), t('common.yes'), t('common.no')) || t('aiQueryEvent.empty')}</span>
                  <span className={`min-w-0 text-sm ${diffText(get(result, k), get(original, k)) ? 'font-medium text-bronzelight' : 'text-paper'}`}>
                    {toStr(get(result, k), t('common.yes'), t('common.no')) || t('aiQueryEvent.empty')}
                  </span>
                  <span className="justify-self-center">
                    <input type="checkbox" className="h-4 w-4 accent-cinnabar" checked={!!sel[k]} onChange={(e) => set(k, e.target.checked)} />
                  </span>
                </div>
              )))}
            </div>
          </div>

          {result.summary && (
            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-[0.2em] text-cinnabarlight">{t('common.summary')}</h4>
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[1fr_1fr_64px] items-center gap-3 rounded-sm border border-paperedge/15 px-3 py-2 text-xs tracking-widest text-paperdim/70">
                    <span>{t('aiQueryEvent.originalColumn')}</span>
                    <span>{t('aiQueryEvent.aiColumn')}</span>
                    <span className="text-center">{t('aiQueryEvent.replaceCheck')}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_64px] items-center gap-3 border-b border-paperedge/5 py-1.5">
                    <p className="whitespace-pre-wrap text-sm text-paperdim">{original.summary || t('aiQueryEvent.empty')}</p>
                    <p className="whitespace-pre-wrap text-sm text-paper">{result.summary}</p>
                    <span className="justify-self-center">
                      <input type="checkbox" className="h-4 w-4 accent-cinnabar" checked={!!sel.summary} onChange={(e) => set('summary', e.target.checked)} />
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3 border-t border-paperedge/15 pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>{t('common.close')}</button>
            <button type="button" className="btn-primary" onClick={handleFill}>{t('aiQueryEvent.fillToEditor')}</button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
