import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      setError(e instanceof Error ? e.message : t('common.loadFailed'))
    }
  }, [t])

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
      flash(t('roles.updateSuccess', { label: editing.cfg.label || ROLE_LABELS[editing.cfg.role] }))
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('roles.updateFailed'))
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
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('roles.title')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Role Management</p>
        </div>
        <p className="text-xs tracking-wider text-paperdim/70">
          {t('roles.description')}
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
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('roles.noRoles')}</p>
        </div>
      ) : menus.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('roles.noMenus')}</p>
          <p className="mt-2 text-xs tracking-wider text-paperdim/60">
            {t('roles.noMenusHint')}
          </p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">{t('roles.role')}</th>
                <th className="px-5 py-3 font-medium">{t('roles.userCount')}</th>
                <th className="px-5 py-3 font-medium">{t('roles.authorizedMenus')}</th>
                <th className="px-5 py-3 text-right font-medium">{t('common.operation')}</th>
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
                        <span className="ml-2 text-xs text-paperdim/50">{t('roles.defaultAllVisible')}</span>
                      )}
                      {!editable && cfg.role !== 'superadmin' && (
                        <span className="ml-2 text-xs text-paperdim/50">{t('roles.insufficientPermission')}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-garamond text-paperdim">{cfg.userCount}</td>
                    <td className="px-5 py-4">
                      {cfg.menuKeys.length === 0 ? (
                        <span className="text-xs tracking-wider text-paperdim/50">{t('roles.noMenusConfigured')}</span>
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
                            <span className="text-xs tracking-wider text-paperdim/55">{t('roles.moreItems', { count: more })}</span>
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
                        {editable ? t('roles.configureMenus') : t('roles.viewMenus')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {me.role !== 'superadmin' && (
            <p className="border-t border-paperedge/10 px-5 py-3 text-xs tracking-wider text-paperdim/60">
              {t('roles.permissionHint')}
            </p>
          )}
        </div>
      )}

      <Modal
        open={!!editing}
        title={editingEditable ? t('roles.configureMenuTitle', { name: editingLabel }) : t('roles.readOnlyMenuTitle', { name: editingLabel })}
        confirmText={editingEditable ? t('common.save') : null}
        cancelText={t('common.close')}
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
                {t('roles.roleLabel')}
                <b className="text-paper">{editingLabel}</b>
              </span>
              <span>·</span>
              <span>
                {t('roles.authorizedMenusLabel')}
                <b className="text-bronzelight">{editing.draft.length}</b> / {menus.length}
              </span>
              {!editingEditable && (
                <>
                  <span>·</span>
                  <span className="text-cinnabarlight" data-testid="readonly-warn">
                    {editing.cfg.role === 'superadmin'
                      ? t('roles.superAdminReadOnly')
                      : t('roles.noPermissionToAdjust')}
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
