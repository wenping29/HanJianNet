import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { LoginLogItem } from '../../types'
import {
  ClientSourceTag,
  NoticeAndError,
  PAGE_SIZE,
  Pagination,
  SearchField,
  SectionTitle,
  StatusBadge,
  formatTime,
} from './_shared'

interface Filters {
  keyword: string
  username: string
  from: string
  to: string
  status: string
}

const EMPTY: Filters = { keyword: '', username: '', from: '', to: '', status: '' }

export default function LoginLogs() {
  const [items, setItems] = useState<LoginLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [form, setForm] = useState<Filters>(EMPTY)
  const [filters, setFilters] = useState<Filters>(EMPTY)

  const reload = useCallback(async (f: Filters, p = 1) => {
    setError('')
    try {
      const res = await api.loginLogs({
        keyword: f.keyword.trim() || undefined,
        username: f.username.trim() || undefined,
        from: f.from || undefined,
        to: f.to || undefined,
        page: p,
        pageSize: PAGE_SIZE,
      })
      let list = Array.isArray(res.items) ? res.items : []
      if (f.status) {
        list = list.filter((x) => x.status === f.status)
      }
      const totalNum = f.status ? list.length : (typeof res.total === 'number' ? res.total : list.length)
      const pageNum = typeof res.page === 'number' ? res.page : p
      const pageSizeNum = typeof res.pageSize === 'number' ? res.pageSize : PAGE_SIZE
      const totalPagesNum = f.status
        ? Math.max(1, Math.ceil(totalNum / Math.max(1, pageSizeNum)))
        : typeof res.totalPages === 'number'
          ? res.totalPages
          : Math.max(1, Math.ceil(totalNum / Math.max(1, pageSizeNum)))
      setItems(list)
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
    reload(filters, 1).finally(() => {
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
    setForm(EMPTY)
    setFilters(EMPTY)
  }

  const goPage = async (n: number) => {
    if (n < 1 || n > totalPages || n === page || loading) return
    setLoading(true)
    await reload(filters, n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setLoading(false)
  }

  return (
    <div className="container-page py-10">
      <SectionTitle zh="登录日志" en="Login Audits" />

      <form
        className="animate-fade-up card mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        onSubmit={onSubmit}
      >
        <SearchField label="关键字（账号 / 用户名 / IP）">
          <input
            className="input"
            value={form.keyword}
            onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            placeholder="支持模糊搜索"
          />
        </SearchField>
        <SearchField label="用户名">
          <input
            className="input"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="精确匹配"
          />
        </SearchField>
        <SearchField label="结果">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="">全部</option>
            <option value="success">成功</option>
            <option value="fail">失败</option>
          </select>
        </SearchField>
        <SearchField label="起始日期">
          <input
            type="date"
            className="input"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
          />
        </SearchField>
        <SearchField label="结束日期">
          <input
            type="date"
            className="input"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
          />
        </SearchField>
        <div className="md:col-span-2 lg:col-span-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onReset}>
            重置
          </button>
          <button type="submit" className="btn-bronze" disabled={loading}>
            {loading ? '查询中…' : '查询'}
          </button>
        </div>
      </form>

      <NoticeAndError error={error} />

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无登录日志</p>
        </div>
      ) : (
        <>
          <div className="card animate-fade-up mt-6 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                  <th className="px-5 py-3 font-medium">时间</th>
                  <th className="px-5 py-3 font-medium">动作</th>
                  <th className="px-5 py-3 font-medium">账号</th>
                  <th className="px-5 py-3 font-medium">用户名</th>
                  <th className="px-5 py-3 font-medium">结果</th>
                  <th className="px-5 py-3 font-medium">状态码</th>
                  <th className="px-5 py-3 font-medium">失败原因</th>
                  <th className="px-5 py-3 font-medium">IP</th>
                  <th className="px-5 py-3 font-medium">来源</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/80 whitespace-nowrap">
                      {formatTime(l.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge border-paperedge/30 bg-paperedge/10 text-paperdim/90">
                        {l.action || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-paperdim">{l.account || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium tracking-wider text-paper">{l.username || '—'}</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim">{l.statusCode}</td>
                    <td className="px-5 py-3 max-w-xs">
                      <span
                        className="text-xs text-cinnabarlight/90 line-clamp-2"
                        title={l.message ?? ''}
                      >
                        {l.message || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim whitespace-nowrap">
                      {l.ip || '—'}
                    </td>
                    <td className="px-5 py-3"><ClientSourceTag s={l.clientSource} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} totalPages={totalPages} loading={loading} label="登录日志" onGo={goPage} />
        </>
      )}
    </div>
  )
}
