import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { formatLifeSpan } from '../lib/format'
import { canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { TraitorSummary } from '../types'

export default function Traitors() {
  const me = useAuth((s) => s.user)!
  const navigate = useNavigate()
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState('')

  const reload = useCallback(async (name?: string) => {
    setError('')
    try {
      const data = await api.adminTraitors(name || undefined)
      setItems(data.items)
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
    setSearched(keyword.trim())
    setLoading(true)
    await reload(keyword.trim())
    setLoading(false)
  }

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">汉奸管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Archive Management</p>
        </div>
        {canManageUsers(me.role) && (
          <button type="button" className="btn-primary" onClick={() => navigate('/traitors/new')}>
            新增汉奸
          </button>
        )}
      </header>

      <form
        className="animate-fade-up mt-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSearch()
        }}
      >
        <input
          className="input max-w-xs"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="按姓名 / 别名搜索"
        />
        <button type="submit" className="btn-bronze" disabled={loading}>
          搜索
        </button>
        {searched && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setKeyword('')
              setSearched('')
              setLoading(true)
              void reload().finally(() => setLoading(false))
            }}
          >
            重置
          </button>
        )}
      </form>

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无档案</p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">姓名</th>
                <th className="px-5 py-3 font-medium">时期</th>
                <th className="px-5 py-3 font-medium">派系</th>
                <th className="px-5 py-3 font-medium">生卒</th>
                <th className="px-5 py-3 font-medium">身份标签</th>
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
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {t.identityTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                          {tag}
                        </span>
                      ))}
                      {t.identityTags.length > 3 && (
                        <span className="badge border-paperedge/25 text-paperdim/70">+{t.identityTags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      {canManageUsers(me.role) && (
                        <button
                          type="button"
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                          onClick={() => navigate(`/traitors/${t.id}/edit`)}
                        >
                          编辑
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
