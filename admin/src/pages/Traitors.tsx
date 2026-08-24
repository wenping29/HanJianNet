import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, resolveAssetUrl } from '../lib/api'
import { formatLifeSpan } from '../lib/format'
import { canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { TraitorSummary } from '../types'

const PAGE_SIZE = 10

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

export default function Traitors() {
  const me = useAuth((s) => s.user)!
  const navigate = useNavigate()
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [searched, setSearched] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const reload = useCallback(async (name?: string, p = 1) => {
    setError('')
    try {
      const data = await api.adminTraitors(name || undefined, p, PAGE_SIZE)
      const items = Array.isArray(data.items) ? data.items : []
      const pageNum = typeof data.page === 'number' ? data.page : p
      const totalNum = typeof data.total === 'number' ? data.total : items.length
      const pageSizeNum = typeof data.pageSize === 'number' ? data.pageSize : PAGE_SIZE
      const totalPagesNum =
        typeof data.totalPages === 'number'
          ? data.totalPages
          : Math.max(1, Math.ceil(totalNum / Math.max(1, pageSizeNum)))
      setItems(items)
      setPage(pageNum)
      setTotal(totalNum)
      setTotalPages(totalPagesNum)
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
    const q = keyword.trim()
    setSearched(q)
    setLoading(true)
    await reload(q, 1)
    setLoading(false)
  }

  const handleReset = async () => {
    setKeyword('')
    setSearched('')
    setLoading(true)
    await reload(undefined, 1)
    setLoading(false)
  }

  const goPage = async (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    setLoading(true)
    await reload(searched || undefined, next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoading(false)
  }

  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages])

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">汉奸管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Archive Management</p>
        </div>
      </header>

      <div className="animate-fade-up mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 md:gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSearch()
          }}
        >
          <input
            className="input min-w-0 max-w-xs flex-1"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="按姓名 / 别名搜索"
          />
          <button type="submit" className="btn-bronze flex-none" disabled={loading}>
            搜索
          </button>
          {searched && (
            <button type="button" className="btn-ghost flex-none" onClick={handleReset}>
              重置
            </button>
          )}
        </form>
        {canManageUsers(me.role) && (
          <button
            type="button"
            className="btn-primary flex-none md:ml-2"
            onClick={() => navigate('/traitors/new')}
          >
            新增汉奸
          </button>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无档案</p>
        </div>
      ) : (
        <>
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
                          <span className="badge border-paperedge/25 text-paperdim/70">
                            +{t.identityTags.length - 3}
                          </span>
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

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs tracking-widest text-paperdim/80">
              共 <span className="font-garamond text-paper">{total}</span> 条档案 · 第
              <span className="mx-1 font-garamond text-paper">{totalPages === 0 ? 0 : page}</span>
              / <span className="font-garamond text-paper">{totalPages}</span> 页
            </div>
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="分页">
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || loading}
              >
                上一页
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
                    disabled={loading}
                    className={`h-8 min-w-8 rounded-sm border px-2 text-xs transition ${
                      n === page
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
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages || loading}
              >
                下一页
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
