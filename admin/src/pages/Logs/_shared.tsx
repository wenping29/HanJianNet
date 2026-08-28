import { useMemo } from 'react'

export const PAGE_SIZE = 20

export function formatTime(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number, w = 2) => String(n).padStart(w, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch {
    return iso
  }
}

export function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: Array<number | '…'> = [1]
  if (page > 3) pages.push('…')
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (page < totalPages - 2) pages.push('…')
  pages.push(totalPages)
  return pages
}

export interface PaginationProps {
  total: number
  page: number
  totalPages: number
  loading: boolean
  label: string
  onGo: (n: number) => void
}

export function Pagination({ total, page, totalPages, loading, label, onGo }: PaginationProps) {
  const pages = useMemo(() => pageWindow(page, totalPages), [page, totalPages])
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="text-xs tracking-widest text-paperdim/80">
        共 <span className="font-garamond text-paper">{total}</span> 条{label} · 第
        <span className="mx-1 font-garamond text-paper">{totalPages === 0 ? 0 : page}</span>
        / <span className="font-garamond text-paper">{totalPages}</span> 页
      </div>
      <nav className="flex flex-wrap items-center gap-1.5" aria-label="分页">
        <button
          type="button"
          className="btn-ghost !px-3 !py-1.5 text-xs"
          onClick={() => onGo(page - 1)}
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
              onClick={() => onGo(n)}
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
          onClick={() => onGo(page + 1)}
          disabled={page >= totalPages || loading}
        >
          下一页
        </button>
      </nav>
    </div>
  )
}

export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? ''
  const ok = /success|approved/i.test(s)
  const fail = /fail|rejected|error/i.test(s)
  const cls = ok
    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
    : fail
      ? 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight'
      : 'border-paperedge/30 bg-paperedge/10 text-paperdim/80'
  const text = s ? (ok ? '成功' : fail ? '失败' : s) : '—'
  return <span className={`badge ${cls}`}>{text}</span>
}

export function LevelBadge({ level }: { level?: string | null }) {
  const l = (level ?? '').toLowerCase()
  let cls = 'border-paperedge/30 bg-paperedge/10 text-paperdim'
  let text = l || '—'
  if (l === 'warning') {
    cls = 'border-amber-500/50 bg-amber-500/10 text-amber-300'
    text = '警告'
  } else if (l === 'error') {
    cls = 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight'
    text = '错误'
  } else if (l === 'critical') {
    cls = 'border-rose-600/70 bg-rose-700/20 text-rose-200'
    text = '严重'
  }
  return <span className={`badge ${cls}`}>{text}</span>
}

export function ClientSourceTag({ s }: { s?: string | null }) {
  const v = (s ?? '').toLowerCase()
  const map: Record<string, string> = { web: '前台 Web', admin: '审校台', api: '开放 API' }
  const label = map[v] || (v || '—')
  return <span className="badge border-bronze/50 bg-bronze/10 text-bronzelight">{label}</span>
}

export function methodColor(method: string): string {
  const m = (method || '').toUpperCase()
  if (m === 'GET') return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
  if (m === 'POST') return 'text-sky-300 border-sky-500/40 bg-sky-500/10'
  if (m === 'PUT') return 'text-amber-300 border-amber-500/40 bg-amber-500/10'
  if (m === 'DELETE') return 'text-rose-300 border-rose-500/50 bg-rose-500/10'
  if (m === 'PATCH') return 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10'
  return 'text-paperdim border-paperedge/30 bg-paperedge/10'
}

export function MethodBadge({ method }: { method: string }) {
  return <span className={`badge border ${methodColor(method)}`}>{(method || '').toUpperCase() || '—'}</span>
}

export function SectionTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{zh}</h1>
        <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">{en}</p>
      </div>
    </header>
  )
}

export function NoticeAndError({ notice, error }: { notice?: string; error?: string }) {
  return (
    <>
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
    </>
  )
}

export function SearchField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-xs tracking-widest text-paperdim">
      <span>{label}</span>
      {children}
    </label>
  )
}
