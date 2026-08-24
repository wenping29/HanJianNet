import { useCallback, useEffect, useMemo, useState } from 'react'
import MenuPicker from '../components/MenuPicker'
import Modal from '../components/Modal'
import { api } from '../lib/api'
import { ROLE_LABELS, roleRank } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { AdminMenuItem, Role, RoleMenuConfig } from '../types'

type EditingState = {
  cfg: RoleMenuConfig
  draft: string[]
}

export default function Roles() {
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<RoleMenuConfig[]>([])
  const [menus, setMenus] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setError('')
    try {
      const [roleData, menuData] = await Promise.all([api.roleMenus(), api.allMenus()])
      setItems(roleData.items)
      setMenus(menuData.items)
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
    window.setTimeout(() => setNotice(''), 3500)
  }

  const openEditor = (cfg: RoleMenuConfig) => {
    setEditing({ cfg, draft: [...cfg.menuKeys] })
  }

  const closeEditor = () => {
    if (saving) return
    setEditing(null)
  }

  const canEditRole = (role: Role) => {
    if (role === 'superadmin') return false
    // 只能调整层级低于自己的角色菜单
    return roleRank(me.role) > roleRank(role)
  }

  const saveDraft = async () => {
    if (!editing || saving) return
    setSaving(true)
    setError('')
    try {
      const data = await api.updateRoleMenus(editing.cfg.role, editing.draft)
      setItems(data.items)
      flash(`已更新「${editing.cfg.label || ROLE_LABELS[editing.cfg.role]}」的菜单权限`)
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const menuLabels = useMemo(() => {
    const m = new Map<string, string>()
    menus.forEach((x) => m.set(x.key, x.label))
    return m
  }, [menus])

  const editingLabel = editing ? editing.cfg.label || ROLE_LABELS[editing.cfg.role] : ''
  const editingEditable = editing
    ? editing.cfg.role !== 'superadmin' && canEditRole(editing.cfg.role as Role)
    : false

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">角色管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Role Management</p>
        </div>
        <p className="text-xs tracking-wider text-paperdim/70">
          点击「配置菜单」可打开弹框，批量勾选角色可见的后台菜单，保存后立即生效
        </p>
      </header>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">
          {notice}
        </p>
      )}
      {!notice && error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
          {error}
        </p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">加载中…</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无角色数据</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">暂无菜单</p>
          <p className="mt-2 text-xs tracking-wider text-paperdim/60">
            请先在「菜单管理」中创建菜单，再回到此页配置权限。
          </p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">用户数</th>
                <th className="px-5 py-3 font-medium">已授权菜单</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cfg) => {
                const editable = cfg.role !== 'superadmin' && canEditRole(cfg.role)
                const label = cfg.label || ROLE_LABELS[cfg.role]
                const grantedPreview = cfg.menuKeys.slice(0, 4).map((k) => menuLabels.get(k) || k)
                const more = cfg.menuKeys.length - grantedPreview.length
                return (
                  <tr key={cfg.role} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{label}</span>
                      {cfg.role === 'superadmin' && (
                        <span className="ml-2 text-xs text-paperdim/50">默认全部可见（只读）</span>
                      )}
                      {!editable && cfg.role !== 'superadmin' && (
                        <span className="ml-2 text-xs text-paperdim/50">权限不足（只读）</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-garamond text-paperdim">{cfg.userCount}</td>
                    <td className="px-5 py-4">
                      {cfg.menuKeys.length === 0 ? (
                        <span className="text-xs tracking-wider text-paperdim/50">未配置任何菜单（该角色可见 0 个）</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {grantedPreview.map((g, i) => (
                            <span
                              key={`${g}-${i}`}
                              className="rounded-sm border border-paperedge/20 bg-ink/50 px-2 py-0.5 text-xs text-paper/85"
                              title={g}
                            >
                              {g}
                            </span>
                          ))}
                          {more > 0 && (
                            <span className="text-xs tracking-wider text-paperdim/55">+ {more} 个</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        className={editable ? 'btn-bronze !px-3 !py-1.5 text-xs' : 'btn-ghost !px-3 !py-1.5 text-xs'}
                        onClick={() => openEditor(cfg)}
                      >
                        {editable ? '配置菜单' : '查看菜单'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {me.role !== 'superadmin' && (
            <p className="border-t border-paperedge/10 px-5 py-3 text-xs tracking-wider text-paperdim/60">
              仅超级管理员可调整所有角色菜单权限；管理员可调整其下层级角色。接口级访问权限由后端角色规则控制。
            </p>
          )}
        </div>
      )}

      <Modal
        open={!!editing}
        title={editingEditable ? `配置菜单：${editingLabel}` : `菜单配置（只读）：${editingLabel}`}
        confirmText={editingEditable ? '保存' : null}
        cancelText="关闭"
        confirmBusy={saving}
        onConfirm={saveDraft}
        onCancel={closeEditor}
        onClose={closeEditor}
        widthClassName="max-w-3xl"
      >
        {editing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-paperedge/15 bg-ink/40 px-4 py-3 text-xs text-paperdim/80">
              <span>
                角色：
                <b className="text-paper">{editingLabel}</b>
              </span>
              <span>·</span>
              <span>
                当前已授权菜单：
                <b className="text-bronzelight">{editing.draft.length}</b> / {menus.length}
              </span>
              {!editingEditable && (
                <>
                  <span>·</span>
                  <span className="text-cinnabarlight" data-testid="readonly-warn">
                    {editing.cfg.role === 'superadmin'
                      ? '超级管理员菜单为只读（始终可见全部）'
                      : '您无权调整该角色菜单，仅可查看'}
                  </span>
                </>
              )}
            </div>
            <MenuPicker
              menus={menus}
              value={editing.draft}
              onChange={(next) =>
                setEditing((prev) => (prev ? { ...prev, draft: next } : prev))
              }
              disabled={!editingEditable}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
