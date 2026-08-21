import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { AdminMenuItem, RoleMenuConfig } from '../types'

export default function Roles() {
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<RoleMenuConfig[]>([])
  const [menus, setMenus] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingRole, setSavingRole] = useState<string | null>(null)

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
    window.setTimeout(() => setNotice(''), 2500)
  }

  const handleToggle = async (cfg: RoleMenuConfig, menuKey: string) => {
    if (cfg.role === 'superadmin' || savingRole) return
    const next = cfg.menuKeys.includes(menuKey)
      ? cfg.menuKeys.filter((k) => k !== menuKey)
      : [...cfg.menuKeys, menuKey]
    setSavingRole(cfg.role)
    setError('')
    try {
      const data = await api.updateRoleMenus(cfg.role, next)
      setItems(data.items)
      flash(`已更新「${cfg.label || ROLE_LABELS[cfg.role]}」的菜单权限`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSavingRole(null)
    }
  }

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">角色管理</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Role Management</p>
        </div>
        <p className="text-xs tracking-wider text-paperdim/70">
          勾选角色可见的后台菜单，保存后立即生效
        </p>
      </header>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">{notice}</p>
      )}
      {!notice && error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
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
          <p className="mt-2 text-xs tracking-wider text-paperdim/60">请先在「菜单管理」中创建菜单，再回到此页配置权限。</p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">用户数</th>
                {menus.map((m) => (
                  <th key={m.id} className="px-5 py-3 text-center font-medium" title={m.path}>
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((cfg) => {
                const locked = cfg.role === 'superadmin'
                const busy = savingRole === cfg.role
                const label = cfg.label || ROLE_LABELS[cfg.role]
                return (
                  <tr key={cfg.role} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{label}</span>
                      {locked && <span className="ml-2 text-xs text-paperdim/50">默认全部可见</span>}
                    </td>
                    <td className="px-5 py-3 font-garamond text-paperdim">{cfg.userCount}</td>
                    {menus.map((m) => {
                      const checked = locked || cfg.menuKeys.includes(m.key)
                      return (
                        <td key={m.id} className="px-5 py-3 text-center">
                          <input
                            type="checkbox"
                            className="accent-cinnabar"
                            aria-label={`${label} 可见 ${m.label}`}
                            checked={checked}
                            disabled={locked || busy}
                            onChange={() => handleToggle(cfg, m.key)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {me.role !== 'superadmin' && (
            <p className="border-t border-paperedge/10 px-5 py-3 text-xs tracking-wider text-paperdim/60">
              仅超级管理员与管理员可调整菜单权限；接口访问权限由后端角色规则控制。
            </p>
          )}
        </div>
      )}
    </div>
  )
}
