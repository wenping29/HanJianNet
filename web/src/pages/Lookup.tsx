import { useState } from 'react'
import TraitorCard from '../components/TraitorCard'
import { api } from '../lib/api'
import type { TraitorSummary } from '../types'
import { containerPageStyle } from "../style"

type ResultState = 'idle' | 'loading' | 'done'

export default function Lookup() {
  const [name, setName] = useState('')
  const [nativePlace, setNativePlace] = useState('')
  const [results, setResults] = useState<TraitorSummary[]>([])
  const [state, setState] = useState<ResultState>('idle')
  const [error, setError] = useState('')
  const [searchedName, setSearchedName] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入姓名')
      return
    }
    setError('')
    setState('loading')
    setSearchedName(name.trim())
    try {
      const data = await api.listTraitors({ name: name.trim(), nativePlace: nativePlace.trim() || undefined })
      setResults(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
      setResults([])
    } finally {
      setState('done')
    }
  }

  function reset() {
    setName('')
    setNativePlace('')
    setResults([])
    setState('idle')
    setSearchedName('')
  }

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

        {/* 查询结果 */}
        {state === 'loading' && (
          <p className="mt-12 text-center text-paperdim">查询中…</p>
        )}

        {state === 'done' && (
          <div className="mt-12">
            {results.length > 0 ? (
              <>
                <div className="mb-6 flex items-center gap-3 rounded-sm border border-cinnabar/40 bg-cinnabar/10 px-5 py-4">
                  <span className="font-song text-lg font-bold text-cinnabarlight">查实</span>
                  <span className="text-sm leading-relaxed text-paperdim">
                    「{searchedName}」在汉奸档案中查实 {results.length} 条记录
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.map((t) => (
                    <TraitorCard key={t.id} traitor={t} />
                  ))}
                </div>
              </>
            ) : (
              <div className="mx-auto max-w-2xl">
                <div className="card flex flex-col items-center px-6 py-12 text-center">
                  <span className="font-song text-2xl font-bold text-paperdim">未查实</span>
                  <p className="mt-3 text-sm leading-relaxed text-paperdim/80">
                    「{searchedName}」
                    {nativePlace.trim() ? `（籍贯：${nativePlace.trim()}）` : ''}
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
