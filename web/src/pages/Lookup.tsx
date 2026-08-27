import { useMemo, useRef, useState } from 'react'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorSummary } from '../types'
import { containerPageStyle } from "../style"

const PAGE_SIZE = 20

type ResultState = 'idle' | 'loading' | 'done'

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

export default function Lookup() {
  const [name, setName] = useState('')
  const [nativePlace, setNativePlace] = useState('')
  const [results, setResults] = useState<TraitorSummary[]>([])
  const [state, setState] = useState<ResultState>('idle')
  const [error, setError] = useState('')
  const [searchedName, setSearchedName] = useState('')
  const [searchedPlace, setSearchedPlace] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const resultRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function runQuery(qName: string, qPlace: string, p: number) {
    setState('loading')
    setError('')
    try {
      const data = await api.listTraitors({
        name: qName,
        nativePlace: qPlace || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      })
      setResults(data.items)
      setTotal(data.total)
      setPage(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setResults([])
      setTotal(0)
    } finally {
      setState('done')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('请输入姓名')
      return
    }
    const trimmedPlace = nativePlace.trim()
    setSearchedName(trimmedName)
    setSearchedPlace(trimmedPlace)
    await runQuery(trimmedName, trimmedPlace, 1)
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function gotoPage(p: number) {
    const target = Math.min(Math.max(1, p), totalPages)
    runQuery(searchedName, searchedPlace, target)
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function reset() {
    setName('')
    setNativePlace('')
    setResults([])
    setState('idle')
    setSearchedName('')
    setSearchedPlace('')
    setTotal(0)
    setPage(1)
    setError('')
  }

  const pageList = useMemo(() => buildPageList(page, totalPages), [page, totalPages])

  return (
    <div>
      {/* 页面标题区 */}
      <section className="ink-hero relative overflow-hidden border-b border-paperedge/10">
        <div style={containerPageStyle} className="container-page animate-ink-in flex flex-col items-center py-20 text-center md:py-24">
          <p className="font-garamond text-sm italic tracking-widest text-bronzelight">TRAITOR LOOKUP</p>
          <h1 className="mt-5 font-song text-3xl font-bold leading-snug tracking-wide text-paper sm:text-4xl md:text-5xl">
            汉奸查询
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            输入姓名与籍贯，查实其人是否录入汉奸档案——青史昭昭，无可遁形。
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* 查询表单 */}
        <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="lk-name">
                姓名 <span className="text-cinnabarlight">*</span>
              </label>
              <input
                id="lk-name"
                className="input"
                placeholder="必填，如 汪精卫"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="lk-place">籍贯</label>
              <input
                id="lk-place"
                className="input"
                placeholder="选填，如 广东番禺"
                value={nativePlace}
                onChange={(e) => setNativePlace(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            {state !== 'idle' && (
              <button type="button" onClick={reset} className="btn-ghost !px-5 !py-2.5">
                清空
              </button>
            )}
            <button type="submit" className="btn-primary !px-6 !py-2.5">
              查 询
            </button>
          </div>
          {error && (
            <p className="mt-4 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-2.5 text-sm text-cinnabarlight">
              {error}
            </p>
          )}
        </form>

        <div ref={resultRef}>
          {/* 查询结果 */}
          {state === 'loading' && (
            <p className="mt-12 text-center text-paperdim">查询中…</p>
          )}

          {state === 'done' && (
            <div className="mt-12">
              {results.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-cinnabar/40 bg-cinnabar/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-song text-lg font-bold text-cinnabarlight">查实</span>
                      <span className="text-sm leading-relaxed text-paperdim">
                        「{searchedName}」在汉奸档案中查实 {total} 条记录
                      </span>
                    </div>
                    <span className="text-xs tracking-wider text-paperdim/70">
                      第 {page} / {totalPages} 页
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {results.map((t) => (
                      <TraitorCard key={t.id} traitor={t} />
                    ))}
                  </div>

                  {/* 分页控件 */}
                  {totalPages > 1 && (
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
                </>
              ) : (
                <div className="mx-auto max-w-2xl">
                  <div className="card flex flex-col items-center px-6 py-12 text-center">
                    <span className="font-song text-2xl font-bold text-paperdim">未查实</span>
                    <p className="mt-3 text-sm leading-relaxed text-paperdim/80">
                      「{searchedName}」
                      {searchedPlace ? `（籍贯：${searchedPlace}）` : ''}
                      未在汉奸档案中查实。
                    </p>
                    <p className="mt-2 text-xs tracking-wider text-paperdim/60">
                      本档案持续编纂，未查实不代表该人清白，亦可能是尚未收录。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 空闲态提示 */}
        {state === 'idle' && (
          <div className="mt-12 text-center text-sm tracking-wider text-paperdim/50">
            输入姓名后点击查询，查看结果
          </div>
        )}
      </section>
    </div>
  )
}
