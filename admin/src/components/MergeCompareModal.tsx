import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { api, resolveAssetUrl } from '../lib/api'
import { formatYear } from '../lib/format'
import type { TraitorDetail } from '../types'

interface MergeGroup {
  name: string
  nativePlace: string
  items: Array<{ id: string }>
}

interface MergeCompareModalProps {
  open: boolean
  group: MergeGroup | null
  /** 由列表页单选决定的合并目标记录 Id */
  defaultPrimaryId: string | null
  onClose: () => void
  onDone: (sourceCount: number, name: string) => void
  onError: (msg: string) => void
}

interface ScalarDef {
  key: string
  labelKey: string
  value: (r: TraitorDetail) => string
}

interface CollDef {
  key: string
  labelKey: string
  items: (r: TraitorDetail) => unknown[]
  preview: (list: unknown[]) => string
}

const SCALAR_FIELDS: ScalarDef[] = [
  { key: 'name', labelKey: 'merge.field.name', value: (r) => r.name },
  { key: 'courtesyName', labelKey: 'merge.field.courtesyName', value: (r) => r.courtesyName ?? '' },
  { key: 'pseudonym', labelKey: 'merge.field.pseudonym', value: (r) => r.pseudonym ?? '' },
  { key: 'birthYear', labelKey: 'merge.field.birthYear', value: (r) => formatYear(r.birthYear, r.birthYearType) },
  { key: 'deathYear', labelKey: 'merge.field.deathYear', value: (r) => formatYear(r.deathYear, r.deathYearType) },
  { key: 'nativePlace', labelKey: 'merge.field.nativePlace', value: (r) => r.nativePlace },
  { key: 'birthPlace', labelKey: 'merge.field.birthPlace', value: (r) => r.birthPlace },
  { key: 'period', labelKey: 'merge.field.period', value: (r) => r.period },
  { key: 'faction', labelKey: 'merge.field.faction', value: (r) => r.faction },
  { key: 'harmLevel', labelKey: 'merge.field.harmLevel', value: (r) => (r.harmLevel != null ? String(r.harmLevel) : '') },
  { key: 'title', labelKey: 'merge.field.title', value: (r) => r.title ?? '' },
  { key: 'summary', labelKey: 'merge.field.summary', value: (r) => r.summary },
]

const COLLECTIONS: CollDef[] = [
  { key: 'aliases', labelKey: 'merge.collection.aliases', items: (r) => r.aliases, preview: (l) => (l as string[]).join('、') },
  { key: 'identityTags', labelKey: 'merge.collection.identityTags', items: (r) => r.identityTags, preview: (l) => (l as string[]).join('、') },
  { key: 'relatedIds', labelKey: 'merge.collection.relatedIds', items: (r) => r.relatedIds, preview: (l) => (l as string[]).join('、') },
  { key: 'spouses', labelKey: 'merge.collection.spouses', items: (r) => r.spouses, preview: (l) => (l as { name: string }[]).map((s) => s.name).join('、') },
  { key: 'children', labelKey: 'merge.collection.children', items: (r) => r.children, preview: (l) => (l as { name: string }[]).map((c) => c.name).join('、') },
  { key: 'residences', labelKey: 'merge.collection.residences', items: (r) => r.residences, preview: (l) => (l as { place: string }[]).map((x) => x.place).join('、') },
  { key: 'crimeRecords', labelKey: 'merge.collection.crimeRecords', items: (r) => r.crimeRecords, preview: (l) => (l as { title: string }[]).map((c) => c.title).join('、') },
  { key: 'lifeEvents', labelKey: 'merge.collection.lifeEvents', items: (r) => r.lifeEvents, preview: (l) => (l as { event: string }[]).map((e) => e.event).join('、') },
  { key: 'attachments', labelKey: 'merge.collection.attachments', items: (r) => r.attachments, preview: (l) => (l as unknown[]).map(() => '▢').join('、') },
  { key: 'sources', labelKey: 'merge.collection.sources', items: (r) => r.sources, preview: (l) => (l as { citation: string }[]).map((s) => s.citation).join('、') },
]

function CellText({ value }: { value: string }) {
  return <span className="min-w-0 text-xs leading-relaxed text-paper/90">{value.trim() || '—'}</span>
}

export default function MergeCompareModal(props: MergeCompareModalProps) {
  const { t } = useTranslation()
  const { open, group, defaultPrimaryId, onClose } = props

  const [records, setRecords] = useState<TraitorDetail[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [scalarSel, setScalarSel] = useState<Record<string, string>>({})
  const [collectionSel, setCollectionSel] = useState<Record<string, string[]>>({})
  const [merging, setMerging] = useState(false)
  const [mergeError, setMergeError] = useState('')

  const memberIds = useMemo(() => (records ?? []).map((r) => r.id), [records])

  useEffect(() => {
    if (!open || !group) return
    setRecords(null)
    setLoading(true)
    setLoadError('')
    setMergeError('')
    let alive = true
    Promise.all(group.items.map((it) => api.adminTraitor(it.id).then((d) => d.traitor)))
      .then((list) => {
        if (!alive) return
        const primary = defaultPrimaryId ?? list[0]?.id ?? ''
        setRecords(list)
        const scalar: Record<string, string> = {}
        for (const f of SCALAR_FIELDS) scalar[f.key] = primary
        const collection: Record<string, string[]> = {}
        for (const c of COLLECTIONS) collection[c.key] = list.map((r) => r.id)
        setScalarSel(scalar)
        setCollectionSel(collection)
      })
      .catch((e) => {
        if (alive) setLoadError(e instanceof Error ? e.message : t('merge.compareFailed'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, group, defaultPrimaryId, t])

  if (!group) return null

  const resetSelection = () => {
    const primary = defaultPrimaryId ?? records?.[0]?.id ?? ''
    const scalar: Record<string, string> = {}
    for (const f of SCALAR_FIELDS) scalar[f.key] = primary
    const collection: Record<string, string[]> = {}
    for (const c of COLLECTIONS) collection[c.key] = memberIds
    setScalarSel(scalar)
    setCollectionSel(collection)
  }

  const toggleCollection = (key: string, rid: string) => {
    setCollectionSel((prev) => {
      const cur = prev[key] ?? memberIds
      const next = cur.includes(rid) ? cur.filter((x) => x !== rid) : [...cur, rid]
      return { ...prev, [key]: next }
    })
  }

  const handleCombine = async () => {
    if (!records) return
    const primaryId = defaultPrimaryId ?? records[0].id
    const sourceIds = records.filter((r) => r.id !== primaryId).map((r) => r.id)
    setMerging(true)
    setMergeError('')
    try {
      await api.mergeTraitors({
        primaryId,
        sourceIds,
        scalarSources: scalarSel,
        collectionSources: collectionSel,
      })
      const primaryName = records.find((r) => r.id === primaryId)?.name ?? group.name
      props.onDone(sourceIds.length, primaryName)
      onClose()
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : t('merge.mergeFailed'))
    } finally {
      setMerging(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('merge.compareTitle', { name: group.name })}
      widthClassName="max-w-6xl"
      onClose={onClose}
      hideFooter
    >
      {loading || !records ? (
        <div className="flex min-h-[240px] items-center justify-center text-paperdim">{t('common.loading')}</div>
      ) : loadError ? (
        <div className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {loadError}
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs leading-relaxed text-paperdim/80">{t('merge.compareHint')}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="w-40 px-3 py-2 font-medium">{t('merge.sourceColumn')}</th>
                  {records.map((r) => {
                    const isPrimary = r.id === (defaultPrimaryId ?? records[0].id)
                    return (
                      <th key={r.id} className="min-w-[220px] px-3 py-2">
                        <div className={`flex items-center gap-2 ${isPrimary ? 'text-cinnabarlight' : ''}`}>
                          {(() => {
                            const photo = r.attachments.find((a) => a.kind === 'photo')
                            return photo ? (
                              <img
                                src={resolveAssetUrl(photo.url)}
                                alt=""
                                className="h-7 w-7 shrink-0 rounded-sm object-cover"
                              />
                            ) : (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 text-[10px] text-paperdim/50">
                                {t('common.none')}
                              </span>
                            )
                          })()}
                          <span className="truncate font-medium tracking-wider">{r.name}</span>
                          {isPrimary && (
                            <span className="badge whitespace-nowrap border-emerald-500/50 bg-emerald-500/10 text-emerald-300">
                              {t('merge.primaryRecord')}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {SCALAR_FIELDS.map((f) => {
                  const selectedId = scalarSel[f.key]
                  return (
                    <tr key={f.key} className="border-b border-paperedge/10 align-top hover:bg-inkcard/40">
                      <td className="px-3 py-2.5">
                        <div className="text-xs font-medium tracking-wider text-paper">{t(f.labelKey)}</div>
                        <div className="mt-0.5 text-[10px] text-paperdim/50">{t('merge.scalarHint')}</div>
                      </td>
                      {records.map((r) => {
                        const active = selectedId === r.id
                        const value = f.value(r)
                        const harmLevel = f.key === 'harmLevel' && value ? t(`harmLevel.${value}`) : ''
                        return (
                          <td key={r.id} className={`px-3 py-2.5 ${active ? 'bg-cinnabar/10' : ''}`}>
                            <label className="flex cursor-pointer items-start gap-2">
                              <input
                                type="radio"
                                name={`scalar-${f.key}`}
                                checked={active}
                                onChange={() => setScalarSel((s) => ({ ...s, [f.key]: r.id }))}
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-cinnabar"
                              />
                              <CellText value={f.key === 'harmLevel' ? harmLevel : value} />
                            </label>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {COLLECTIONS.map((c) => (
                  <tr key={c.key} className="border-b border-paperedge/10 align-top hover:bg-inkcard/40">
                    <td className="px-3 py-2.5">
                      <div className="text-xs font-medium tracking-wider text-paper">{t(c.labelKey)}</div>
                      <div className="mt-0.5 text-[10px] text-paperdim/50">{t('merge.collectionHint')}</div>
                    </td>
                    {records.map((r) => {
                      const list = c.items(r)
                      const active = (collectionSel[c.key] ?? memberIds).includes(r.id)
                      return (
                        <td key={r.id} className={`px-3 py-2.5 ${active ? 'bg-cinnabar/10' : ''}`}>
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleCollection(c.key, r.id)}
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-cinnabar"
                            />
                            <span className="min-w-0">
                              {list.length > 0 ? (
                                <>
                                  <CellText value={c.preview(list)} />
                                  <span className="ml-1 text-[10px] text-paperdim/60">
                                    {t('merge.itemsCount', { count: list.length })}
                                  </span>
                                </>
                              ) : (
                                <CellText value="" />
                              )}
                            </span>
                          </label>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mergeError && (
            <p className="mt-4 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
              {mergeError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-paperedge/15 pt-4">
            <span className="mr-auto text-xs text-paperdim/60">{t('merge.totalItems', { count: records.length })}</span>
            <button type="button" className="btn-ghost" onClick={resetSelection} disabled={merging}>
              {t('merge.resetSelection')}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={merging}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn-primary" onClick={handleCombine} disabled={merging}>
              {merging ? t('merge.merging') : t('merge.combine')}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}