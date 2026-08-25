import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { WebMenu } from '../types'

interface WebMenuForm {
  label: string
  path: string
  sort: number
  isEnabled: boolean
}

export default function WebMenus() {
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<WebMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [editing, setEditing] = useState<WebMenu | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<WebMenuForm>({ label: '', path: '', sort: 0, isEnabled: true })
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.listWebMenus()
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

  useEffect(() => {
    if (!showForm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeForm()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, saving])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const openEdit = (m: WebMenu) => {
    setEditing(m)
    setForm({ label: m.label, path: m.path, sort: m.sort, isEnabled: m.isEnabled })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
  }

  // 快速切换启用/停用
  const toggleEnabled = async (m: WebMenu) => {
    const prev = items
    setItems((arr) => arr.map((i) => (i.id === m.id ? { ...i, isEnabled: !m.isEnabled } : i)))
    try {
      await api.updateWebMenu(m.id, {
        label: m.label,
        path: m.path,
        sort: m.sort,
        isEnabled: !m.isEnabled,
      })
      flash(`菜单「${m.label}」已${!m.isEnabled ? '启用' : '停用'}`)
    } catch {
      setItems(prev) // 回滚
      setError('操作失败')
    }
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await api.updateWebMenu(editing.id, form)
      flash(`菜单「${form.label}」已更新`)
      setShowForm(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const manageable = canManageUsers(me.role)

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">前台菜单</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Web Menu Configuration</p>
        </div>
        <p className="text-xs leading-relaxed text-paperdim/70">
          配置前台（web 项目）导航菜单的启用/停用、显示名称、路径与排序。
          <br />
          停用后菜单将从前台导航栏隐藏，不影响路由本身。
        </p>
      </header>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">{notice}</p>
      )}
      {!showForm && error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无前台菜单数据</p>
          <p className="mt-2 text-xs text-paperdim/50">请启动后端服务，种子数据将自动创建</p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">标识</th>
                <th className="px-5 py-3 font-medium">名称</th>
                <th className="px-5 py-3 font-medium">路径</th>
                <th className="px-5 py-3 font-medium">排序</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                  <td className="px-5 py-3 font-garamond tracking-wider text-paperdim/80">{m.key}</td>
                  <td className="px-5 py-3 font-medium tracking-wider text-paper">{m.label}</td>
                  <td className="px-5 py-3 font-garamond text-paperdim">{m.path}</td>
                  <td className="px-5 py-3 text-paperdim">{m.sort}</td>
                  <td className="px-5 py-3">
                    {manageable ? (
                      <button
                        type="button"
                        onClick={() => toggleEnabled(m)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          m.isEnabled ? 'bg-cinnabar/70' : 'bg-paperedge/30'
                        }`}
                        title={m.isEnabled ? '点击停用' : '点击启用'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-paper transition-transform ${
                            m.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    ) : (
                      <span
                        className={`badge ${m.isEnabled ? 'border-bronze/60 bg-bronze/15 text-bronzelight' : 'border-paperedge/40 bg-inkcard text-paperdim/50'}`}
                      >
                        {m.isEnabled ? '启用' : '停用'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      {manageable && (
                        <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openEdit(m)}>
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

      {showForm && manageable && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6" onClick={closeForm}>
          <div
            className="card animate-fade-up w-full max-w-lg p-6"
            role="dialog"
            aria-modal="true"
            aria-label="修改前台菜单"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">修改前台菜单</h2>
              <button
                type="button"
                aria-label="关闭"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-paperedge/40 text-paperdim transition hover:border-cinnabar hover:text-cinnabarlight"
                onClick={closeForm}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-paperdim/50">
              标识 <code className="font-garamond text-bronzelight/70">{editing.key}</code> 不可修改
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                名称
                <input
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="如 首页"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                路径
                <input
                  className="input"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="/"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                排序
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.sort}
                  onChange={(e) => setForm({ ...form, sort: Number(e.target.value) || 0 })}
                />
              </label>
              <div className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                状态
                <div className="flex h-9 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isEnabled: !form.isEnabled })}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                      form.isEnabled ? 'bg-cinnabar/70' : 'bg-paperedge/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-paper transition-transform ${
                        form.isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm normal-case tracking-normal text-paper">
                    {form.isEnabled ? '启用' : '停用'}
                  </span>
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-ghost" disabled={saving} onClick={closeForm}>
                取消
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
