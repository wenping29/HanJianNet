import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ROLE_LABELS, ROLE_OPTIONS, canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { AdminMenuItem, Role } from '../types'

interface MenuForm {
  key: string
  path: string
  label: string
  order: number
  roles: Role[]
}

const EMPTY_FORM: MenuForm = { key: '', path: '', label: '', order: 0, roles: ['manager', 'admin', 'superadmin'] }

export default function Menus() {
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [editing, setEditing] = useState<AdminMenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.allMenus()
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

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (m: AdminMenuItem) => {
    setEditing(m)
    setForm({ key: m.key, path: m.path, label: m.label, order: m.order, roles: [...m.roles] })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
  }

  const toggleRole = (role: Role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.updateMenu(editing.id, form)
        flash(`菜单「${form.label}」已更新`)
      } else {
        await api.createMenu(form)
        flash(`菜单「${form.label}」已创建`)
      }
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
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">菜单管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Menu Management</p>
        </div>
        {manageable && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            新增菜单
          </button>
        )}
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
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无菜单</p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">标识</th>
                <th className="px-5 py-3 font-medium">名称</th>
                <th className="px-5 py-3 font-medium">路径</th>
                <th className="px-5 py-3 font-medium">排序</th>
                <th className="px-5 py-3 font-medium">可见角色</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                  <td className="px-5 py-3 font-garamond tracking-wider text-paperdim/80">{m.key}</td>
                  <td className="px-5 py-3 font-medium tracking-wider text-paper">{m.label}</td>
                  <td className="px-5 py-3 font-garamond text-paperdim">{m.path}</td>
                  <td className="px-5 py-3 text-paperdim">{m.order}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {m.roles.map((r) => (
                        <span key={r} className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                          {ROLE_LABELS[r]}
                        </span>
                      ))}
                    </div>
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

      {showForm && manageable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6" onClick={closeForm}>
          <div
            className="card animate-fade-up w-full max-w-lg p-6"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? '修改菜单' : '新增菜单'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">
                {editing ? '修改菜单' : '新增菜单'}
              </h2>
              <button
                type="button"
                aria-label="关闭"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-paperedge/40 text-paperdim transition hover:border-cinnabar hover:text-cinnabarlight"
                onClick={closeForm}
              >
                ✕
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                标识
                <input
                  className="input"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  placeholder="如 reviews"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                名称
                <input
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="如 待审队列"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim sm:col-span-2">
                路径
                <input
                  className="input"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="/reviews"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                排序
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                />
              </label>
              <div className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                可见角色
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {ROLE_OPTIONS.map((r) => (
                    <label key={r} className="flex cursor-pointer items-center gap-1.5 normal-case tracking-normal">
                      <input
                        type="checkbox"
                        className="accent-cinnabar"
                        checked={form.roles.includes(r)}
                        onChange={() => toggleRole(r)}
                      />
                      {ROLE_LABELS[r]}
                    </label>
                  ))}
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
