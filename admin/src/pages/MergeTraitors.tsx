import { useCallback, useEffect, useState } from 'react'
import { api, resolveAssetUrl } from '../lib/api'
import { formatLifeSpan } from '../lib/format'
import type { DuplicateGroup } from '../types'

export default function MergeTraitors() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState({ name: '', nativePlace: '' })
  const [filters, setFilters] = useState({ name: '', nativePlace: '' })

  // 每组的主记录选择：groupKey -> selected itemId
  const [primaryMap, setPrimaryMap] = useState<Record<string, string>>({})
  const [merging, setMerging] = useState<string | null>(null) // groupKey

  const groupKey = (g: DuplicateGroup) => `${g.name}||${g.nativePlace}`

  const reload = useCallback(async (f: { name: string; nativePlace: string }) => {
    setError('')
    try {
      const data = await api.findDuplicates(f.name.trim() || undefined, f.nativePlace.trim() || undefined)
      const list = Array.isArray(data.items) ? data.items : []
      setGroups(list)
      // 默认选每组第一条（最早创建）为主记录
      const map: Record<string, string> = {}
      for (const g of list) {
        if (g.items.length > 0) map[groupKey(g)] = g.items[0].id
      }
      setPrimaryMap(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    reload(filters).finally(() => {
      if (alive) setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [filters, reload])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...form })
  }

  const onReset = () => {
    setForm({ name: '', nativePlace: '' })
    setFilters({ name: '', nativePlace: '' })
  }

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const handleMerge = async (g: DuplicateGroup) => {
    const key = groupKey(g)
    const primaryId = primaryMap[key]
    if (!primaryId) {
      setError('请先选择主记录')
      return
    }
    const sourceIds = g.items.filter((t) => t.id !== primaryId).map((t) => t.id)
    if (sourceIds.length === 0) {
      setError('该组只有一条记录，无需合并')
      return
    }

    const primary = g.items.find((t) => t.id === primaryId)
    if (!window.confirm(
      `确认将 ${sourceIds.length} 条重复记录合并到「${primary?.name ?? primaryId}」？\n` +
      `所有子记录（配偶/子女/住所/罪行/生平/附件/来源）将迁移到主记录，重复记录将被标记为已合并。`
    )) return

    setMerging(key)
    setError('')
    try {
      await api.mergeTraitors(primaryId, sourceIds)
      flash(`已合并 ${sourceIds.length} 条记录到「${primary?.name ?? '主记录'}」`)
      await reload(filters)
    } catch (e) {
      setError(e instanceof Error ? e.message : '合并失败')
    } finally {
      setMerging(null)
    }
  }

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">数据合并</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Merge Duplicates</p>
        </div>
      </header>

      <form
        className="animate-fade-up mt-6 flex flex-col gap-3 md:flex-row md:items-center md:gap-4"
        onSubmit={onSubmit}
      >
        <input
          className="input min-w-0 max-w-xs flex-1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="按姓名搜索"
        />
        <input
          className="input min-w-0 max-w-xs flex-1"
          value={form.nativePlace}
          onChange={(e) => setForm({ ...form, nativePlace: e.target.value })}
          placeholder="按籍贯搜索"
        />
        <button type="submit" className="btn-bronze flex-none" disabled={loading}>
          {loading ? '查询中…' : '查找重复'}
        </button>
        <button type="button" className="btn-ghost flex-none" onClick={onReset}>
          重置
        </button>
      </form>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">
          {notice}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : groups.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无重复记录</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) => {
            const key = groupKey(g)
            const primaryId = primaryMap[key]
            return (
              <div key={key} className="card animate-fade-up overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paperedge/20 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tracking-wider text-paper">{g.name}</span>
                    <span className="font-garamond text-xs text-paperdim/70">{g.nativePlace || '籍贯不详'}</span>
                    <span className="badge border-cinnabar/50 bg-cinnabar/10 text-cinnabarlight">
                      共 {g.items.length} 条
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-primary !px-3 !py-1.5 text-xs"
                    onClick={() => handleMerge(g)}
                    disabled={merging === key}
                  >
                    {merging === key ? '合并中…' : '合并到主记录'}
                  </button>
                </div>
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                      <th className="px-3 py-2 font-medium">主记录</th>
                      <th className="px-5 py-2 font-medium">姓名</th>
                      <th className="px-5 py-2 font-medium">时期</th>
                      <th className="px-5 py-2 font-medium">派系</th>
                      <th className="px-5 py-2 font-medium">生卒</th>
                      <th className="px-5 py-2 font-medium">身份标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((t) => {
                      const isPrimary = primaryId === t.id
                      return (
                        <tr
                          key={t.id}
                          className={`border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60 ${
                            isPrimary ? 'bg-cinnabar/5' : ''
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="radio"
                              name={key}
                              checked={isPrimary}
                              onChange={() => setPrimaryMap({ ...primaryMap, [key]: t.id })}
                              className="h-4 w-4 accent-cinnabar"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {t.photoUrl ? (
                                <img
                                  src={resolveAssetUrl(t.photoUrl)}
                                  alt=""
                                  className="h-8 w-8 shrink-0 rounded-sm object-cover"
                                />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-paperedge/20 font-song text-xs text-paperdim/60">
                                  无
                                </span>
                              )}
                              <span className="font-medium tracking-wider text-paper">{t.name}</span>
                              {isPrimary && (
                                <span className="badge border-emerald-500/50 bg-emerald-500/10 text-emerald-300">
                                  主记录
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-paperdim">{t.period}</td>
                          <td className="px-5 py-3 text-paperdim">{t.faction || '—'}</td>
                          <td className="px-5 py-3 font-garamond text-xs text-paperdim/80">
                            {formatLifeSpan(t.birthYear, t.deathYear, t.birthYearType, t.deathYearType)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {t.identityTags.slice(0, 3).map((tag) => (
                                <span key={tag} className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                                  {tag}
                                </span>
                              ))}
                              {t.identityTags.length > 3 && (
                                <span className="badge border-paperedge/25 text-paperdim/70">
                                  +{t.identityTags.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
