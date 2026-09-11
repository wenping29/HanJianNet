import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      setError(err instanceof Error ? err.message : t('lookup.queryFailed'))
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
      setError(t('lookup.nameRequired'))
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
            {t('lookup.title')}
          </h1>
          <p className="mt-6 max-w-2xl leading-loose text-paperdim">
            {t('lookup.heroText')}
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        {/* 查询表单 */}
        <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="lk-name">
                {t('lookup.name')} <span className="text-cinnabarlight">*</span>
              </label>
              <input
                id="lk-name"
                className="input"
                placeholder={t('lookup.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="lk-place">{t('lookup.nativePlace')}</label>
              <input
                id="lk-place"
                className="input"
                placeholder={t('lookup.nativePlacePlaceholder')}
                value={nativePlace}
                onChange={(e) => setNativePlace(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            {state !== 'idle' && (
              <button type="button" onClick={reset} className="btn-ghost !px-5 !py-2.5">
                {t('lookup.clear')}
              </button>
            )}
            <button type="submit" className="btn-primary !px-6 !py-2.5">
              {t('lookup.searchBtn')}
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
            <p className="mt-12 text-center text-paperdim">{t('lookup.searching')}</p>
          )}

          {state === 'done' && (
            <div className="mt-12">
              {results.length > 0 ? (
                <>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-cinnabar/40 bg-cinnabar/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-song text-lg font-bold text-cinnabarlight">{t('lookup.found')}</span>
                      <span className="text-sm leading-relaxed text-paperdim">
                        {t('lookup.foundResult', { name: searchedName, count: total })}
                      </span>
                    </div>
                    <span className="text-xs tracking-wider text-paperdim/70">
                      {t('common.pageInfo', { page, totalPages })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {results.map((t) => (
                      <TraitorCard key={t.id} traitor={t} />
                    ))}
                  </div>

                  {/* 分页控件 */}
                  {totalPages > 1 && (
                    <nav className="mt-10 flex items-center justify-center gap-2 flex-wrap" aria-label={t('common.pagination')}>
                      <button
                        type="button"
                        onClick={() => gotoPage(page - 1)}
                        disabled={page <= 1}
                        className="btn-ghost !px-3 !py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t('common.prevPage')}
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
                        {t('common.nextPage')}
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="mx-auto max-w-2xl">
                  <div className="card flex flex-col items-center px-6 py-12 text-center">
                    <span className="font-song text-2xl font-bold text-paperdim">{t('lookup.notFound')}</span>
                    <p className="mt-3 text-sm leading-relaxed text-paperdim/80">
                      {t('lookup.notFoundResult', { name: searchedName, place: searchedPlace })}
                    </p>
                    <p className="mt-2 text-xs tracking-wider text-paperdim/60">
                      {t('lookup.notFoundNote')}
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
            {t('lookup.idleHint')}
          </div>
        )}
      </section>
    </div>
  )
}
