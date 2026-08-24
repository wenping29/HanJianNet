import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useAuth } from '../stores/auth'
import type { Revision } from '../types'

export default function Profile() {
  const user = useAuth((s) => s.user)
  const [items, setItems] = useState<Revision[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api
      .mySubmissions()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-page max-w-5xl py-10">
      <h1 className="section-title">
        <span className="text-xl font-semibold tracking-[0.25em] text-paper">个人中心</span>
        <span className="font-garamond text-xs italic text-bronzelight">MY SUBMISSIONS</span>
      </h1>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="text-sm text-paperdim">
          <span className="mr-4 tracking-widest text-paper">{user?.username}</span>
          <span>{user?.email}</span>
        </div>
        <Link to="/submit" className="btn-primary !px-4 !py-2 text-xs">
          + 提交新档案
        </Link>
      </div>

      {loading && <p className="py-16 text-center text-paperdim">加载中…</p>}
      {error && (
        <p className="mt-8 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-4 py-3 text-sm text-cinnabarlight">{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="py-16 text-center text-paperdim">暂无提交记录，去提交第一份档案吧</p>
      )}

      {items.length > 0 && (
        <div className="card mt-6 overflow-x-auto">
          <table className="table-old">
            <thead>
              <tr>
                <th>提交时间</th>
                <th>类型</th>
                <th>修改内容摘要</th>
                <th>状态</th>
                <th>审核意见</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-garamond">{formatDateTime(r.submittedAt)}</td>
                  <td>{r.traitorId ? '编辑档案' : '新建档案'}</td>
                  <td className="max-w-xs">{r.changeSummary}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[12rem] text-paperdim">{r.reviewComment || '—'}</td>
                  <td>
                    {r.traitorId ? (
                      <Link
                        to={`/traitor/${r.traitorId}`}
                        className="text-bronzelight underline underline-offset-4 hover:text-paper"
                      >
                        查看档案
                      </Link>
                    ) : (
                      '—'
                    )}
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
