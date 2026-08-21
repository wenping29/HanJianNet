import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ROLE_LABELS, ROLE_OPTIONS, canAssignRole, canManageUsers, roleRank } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { Role, User } from '../types'

interface CreateForm {
  username: string
  email: string
  password: string
  role: Role
}

const EMPTY_CREATE: CreateForm = { username: '', email: '', password: '', role: 'user' }

export default function Users() {
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '' })
  const [savingId, setSavingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.users()
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

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      await api.createUser(createForm)
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      flash('用户创建成功')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (u: User) => {
    setEditingId(u.id)
    setEditForm({ username: u.username, email: u.email, password: '' })
  }

  const handleSaveEdit = async (u: User) => {
    setSavingId(u.id)
    setError('')
    try {
      await api.updateUser(u.id, {
        username: editForm.username,
        email: editForm.email,
        password: editForm.password || undefined,
      })
      setEditingId(null)
      flash('用户信息已更新')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSavingId(null)
    }
  }

  const handleRoleChange = async (u: User, role: Role) => {
    setError('')
    try {
      await api.changeRole(u.id, role)
      flash(`已将 ${u.username} 的角色调整为 ${ROLE_LABELS[role]}`)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '角色调整失败')
    }
  }

  const handleDelete = async (u: User) => {
    if (!window.confirm(`确定删除用户「${u.username}」？该操作不可恢复。`)) return
    setError('')
    try {
      await api.deleteUser(u.id)
      flash('用户已删除')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const manageable = canManageUsers(me.role)

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">用户管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">User Management</p>
        </div>
        {manageable && (
          <button type="button" className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? '收起新增' : '新增用户'}
          </button>
        )}
      </header>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">{notice}</p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {showCreate && manageable && (
        <div className="card animate-fade-up mt-6 p-6">
          <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">新增用户</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
              用户名
              <input
                className="input"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="至少 2 个字符"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
              邮箱
              <input
                className="input"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
              初始密码
              <input
                className="input"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="至少 8 位"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
              角色
              <select
                className="input"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
              >
                {ROLE_OPTIONS.filter((r) => roleRank(r) < roleRank(me.role)).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" className="btn-primary w-full" disabled={creating} onClick={handleCreate}>
                {creating ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无用户</p>
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">用户名</th>
                <th className="px-5 py-3 font-medium">邮箱</th>
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">注册时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const editable = editingId === u.id
                const canTouchThis =
                  manageable && u.id !== me.id && roleRank(me.role) > roleRank(u.role)
                return (
                  <tr key={u.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="px-5 py-3">
                      {editable ? (
                        <input
                          className="input !py-1.5 text-sm"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium tracking-wider text-paper">
                          {u.username}
                          {u.id === me.id && <span className="ml-2 text-xs text-paperdim/60">（我）</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editable ? (
                        <input
                          className="input !py-1.5 text-sm"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        <span className="text-paperdim">{u.email}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {canTouchThis ? (
                        <select
                          className="input !py-1.5 text-sm"
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                        >
                          <option value={u.role}>{ROLE_LABELS[u.role]}</option>
                          {ROLE_OPTIONS.filter(
                            (r) => r !== u.role && canAssignRole(me, u, r),
                          ).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-garamond text-xs text-paperdim/70">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {canTouchThis &&
                          (editable ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary !px-3 !py-1.5 text-xs"
                                disabled={savingId === u.id}
                                onClick={() => handleSaveEdit(u)}
                              >
                                {savingId === u.id ? '保存中…' : '保存'}
                              </button>
                              <button
                                type="button"
                                className="btn-ghost !px-3 !py-1.5 text-xs"
                                onClick={() => setEditingId(null)}
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-ghost !px-3 !py-1.5 text-xs"
                                onClick={() => startEdit(u)}
                              >
                                编辑
                              </button>
                              <button
                                type="button"
                                className="btn-ghost !px-3 !py-1.5 text-xs !text-cinnabarlight"
                                onClick={() => handleDelete(u)}
                              >
                                删除
                              </button>
                            </>
                          ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
