import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { PERIODS } from '../lib/format'
import { formatLifeSpan } from '../lib/format'
import type { TraitorSummary } from '../types'
import { containerPageStyle } from '../style'

const PAGE_SIZE = 20
const EMPTY_FILTERS: TraitorFilters = { name: '', period: undefined }

/** 生成分页按钮上显示的页码列表：首尾页 + 当前页附近 + 省略号 */
function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 1) return [1]
  const windows: Array<number | '...'> = []
  const addRange = (from: number, to: number) => {
    for (let i = from; i <= to; i++) windows.push(i)
  }
  const delta = 2
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  windows.push(1)
  if (left > 2) windows.push('...')
  addRange(left, right)
  if (right < total - 1) windows.push('...')
  if (total > 1) windows.push(total)

  return windows
}

export default function Roster() {
  const [filters, setFilters] = useState<TraitorFilters>(EMPTY_FILTERS)
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const loadList = useCallback(async (f: TraitorFilters, p: number) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listTraitors({ ...f, page: p, pageSize: PAGE_SIZE })
      setItems(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList(EMPTY_FILTERS, 1)
  }, [loadList])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    loadList(filters, 1)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function pickPeriod(period?: string) {
    const next = { ...filters, period: period as TraitorFilters['period'] }
    setFilters(next)
    setPage(1)
    loadList(next, 1)
  }

  function gotoPage(p: number) {
    const target = Math.min(Math.max(1, p), totalPages)
    setPage(target)
    loadList(filters, target)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages])

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div  style={containerPageStyle}  className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TRAITOR ROSTER</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            名录档案
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            以名册形式胪列全部在册变节者，可按姓名、时期检索——录其名，存其档。
          </p>
        </div>
      </section>

      <section ref={listRef} className="container-page py-16">
        {/* 检索栏 */}
        <form onSubmit={submitSearch} className="card mb-6 flex flex-wrap items-end gap-4 p-5">
          <div className="flex-1">
            <label className="label" htmlFor="r-name">姓名检索</label>
            <input
              id="r-name"
              className="input"
              placeholder="输入姓名关键词"
              value={filters.name ?? ''}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary !px-6 !py-2.5">
            检 索
          </button>
          <Link to="/submit" className="btn-bronze !px-6 !py-2.5">
            + 新增汉奸
          </Link>
        </form>

        {/* 时期切换 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => pickPeriod(undefined)}
              className={`badge cursor-pointer ${
                !filters.period ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight' : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
              }`}
            >
              全部时期
            </button>
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => pickPeriod(p)}
                className={`badge cursor-pointer ${
                  filters.period === p
                    ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight'
                    : 'border-paperedge/25 text-paperdim hover:border-bronzelight'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="text-xs tracking-wider text-paperdim/70">
            {loading ? '检索中…' : `共 ${total} 条档案 · 第 ${page} / ${totalPages} 页`}
          </span>
        </div>

        {/* 状态提示 */}
        {loading && <p className="py-16 text-center text-paperdim">加载中…</p>}
        {error && (
          <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">{error}</p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="py-16 text-center text-paperdim">暂无符合条件的档案</p>
        )}

        {/* 名录表格 */}
        {!loading && !error && items.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="table-old">
              <thead>
                <tr>
                  <th className="w-10 text-center">序</th>
                  <th>姓名</th>
                  <th>时期</th>
                  <th>派系</th>
                  <th>生卒年</th>
                  <th>身份标签</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t, i) => (
                  <tr key={t.id}>
                    <td className="text-center font-garamond text-paperdim">{i + 1 + (page - 1) * PAGE_SIZE}</td>
                    <td>
                      <Link
                        to={`/traitor/${t.id}`}
                        className="font-song font-semibold tracking-widest text-paper hover:text-cinnabarlight"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td>
                      <span className="badge border-bronze/40 text-bronzelight">{t.period}</span>
                    </td>
                    <td className="text-paperdim">{t.faction || '—'}</td>
                    <td className="whitespace-nowrap font-garamond text-paperdim">
                      {formatLifeSpan(t.birthYear, t.deathYear, t.birthYearType, t.deathYearType)}
                    </td>
                    <td>
                      {t.identityTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {t.identityTags.map((tag) => (
                            <span key={tag} className="badge border-paperedge/25 text-paperdim/80">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-paperdim/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页控件 */}
        {!loading && !error && totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap" aria-label="分页导航">
            <button
              type="button"
              onClick={() => gotoPage(page - 1)}
              disabled={page <= 1}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹ 上一页
            </button>

            {pageList.map((p, idx) =>
              p === '...' ? (
                <span key={`e${idx}`} className="px-2 text-sm text-paperdim/60">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => gotoPage(p)}
                  className={`min-w-[36px] rounded-sm border px-2 py-1.5 text-sm transition ${
                    p === page
                      ? 'border-cinnabar bg-cinnabar/20 text-cinnabarlight shadow-seal'
                      : 'border-paperedge/25 text-paperdim hover:border-bronzelight hover:text-paper'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => gotoPage(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页 ›
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
