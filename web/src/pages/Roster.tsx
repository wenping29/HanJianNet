import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { TraitorFilters } from '../lib/api'
import { PERIODS } from '../lib/format'
import { formatLifeSpan } from '../lib/format'
import type { TraitorSummary } from '../types'

const EMPTY_FILTERS: TraitorFilters = { name: '', period: undefined }

export default function Roster() {
  const [filters, setFilters] = useState<TraitorFilters>(EMPTY_FILTERS)
  const [items, setItems] = useState<TraitorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadList = useCallback(async (f: TraitorFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listTraitors(f)
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList(EMPTY_FILTERS)
  }, [loadList])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    loadList(filters)
  }

  function pickPeriod(period?: string) {
    const next = { ...filters, period: period as TraitorFilters['period'] }
    setFilters(next)
    loadList(next)
  }

  return (
    <div>
      {/* 页面标题区 */}
      {/* <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TRAITOR ROSTER</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            名录档案
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            以名册形式胪列全部在册变节者，可按姓名、时期检索——录其名，存其档。
          </p>
        </div>
      </section> */}

      <section className="container-page py-16">
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
            {loading ? '检索中…' : `共 ${items.length} 条档案`}
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
                    <td className="text-center font-garamond text-paperdim">{i + 1}</td>
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
      </section>
    </div>
  )
}
