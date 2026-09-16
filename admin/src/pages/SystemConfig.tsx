import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import { api } from '../lib/api'
import { canManageUsers } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { SystemConfig } from '../types'

const CATEGORY_ORDER = ['web', 'webapi', 'mobileapp']

function categoryLabel(category: string): string {
  switch (category) {
    case 'web':
      return 'Web 前台'
    case 'webapi':
      return 'WebApi 后端'
    case 'mobileapp':
      return '移动端'
    default:
      return category || '其他'
  }
}

export default function SystemConfigPage() {
  const { t } = useTranslation()
  const me = useAuth((s) => s.user)!
  const [items, setItems] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [editing, setEditing] = useState<SystemConfig | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ value: '', description: '' })
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setError('')
    try {
      const data = await api.listSystemConfigs()
      setItems(data.items)
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

  const grouped = useMemo(() => {
    const map = new Map<string, SystemConfig[]>()
    for (const it of items) {
      const arr = map.get(it.category) ?? []
      arr.push(it)
      map.set(it.category, arr)
    }
    const keys = Array.from(map.keys()).sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a)
      const bi = CATEGORY_ORDER.indexOf(b)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
    return keys.map((k) => ({ category: k, rows: map.get(k)! }))
  }, [items])

  const flash = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const openEdit = (c: SystemConfig) => {
    setEditing(c)
    setForm({ value: c.value, description: c.description ?? '' })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await api.updateSystemConfig(editing.id, {
        value: form.value,
        description: form.description.trim() || null,
      })
      flash(t('systemConfig.updateSuccess', { key: editing.key }))
      setShowForm(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('systemConfig.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const manageable = canManageUsers(me.role)

return (
    <div className="container-page py-5">
      <PageHeader
        title={t('systemConfig.title')}
        subtitle="System Configuration"
      >
        <p className="text-xs leading-relaxed text-paperdim/70">
          {t('systemConfig.description')}
          <br />
          {t('systemConfig.hint')}
        </p>
      </PageHeader>

      {notice && (
        <p className="mt-6 rounded-sm border border-bronze/50 bg-bronze/10 px-3 py-2 text-sm text-bronzelight">{notice}</p>
      )}
      {!showForm && error && (
        <p className="mt-6 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
      )}

      {loading ? (
        <div className="card mt-6 p-12 text-center text-paperdim">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center">
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('systemConfig.noData')}</p>
          <p className="mt-2 text-xs text-paperdim/50">{t('systemConfig.startBackend')}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map((g) => (
            <section key={g.category} className="card animate-fade-up overflow-x-auto">
              <header className="border-b border-paperedge/15 px-5 py-3">
                <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">{categoryLabel(g.category)}</h2>
                <span className="font-garamond text-xs italic tracking-wider text-bronzelight">{g.category}</span>
              </header>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                    <th className="px-5 py-3 font-medium">{t('systemConfig.key')}</th>
                    <th className="px-5 py-3 font-medium">{t('systemConfig.value')}</th>
                    <th className="px-5 py-3 font-medium">{t('systemConfig.description')}</th>
                    <th className="px-5 py-3 font-medium">{t('systemConfig.updatedAt')}</th>
                    <th className="px-5 py-3 text-right font-medium">{t('common.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((c) => (
                    <tr key={c.id} className="border-b border-paperedge/10 last:border-0 hover:bg-inkcard/60">
                      <td className="px-5 py-3 font-garamond tracking-wider text-paperdim/80">{c.key}</td>
                      <td className="px-5 py-3 font-medium tracking-wider text-paper">{c.value}</td>
                      <td className="px-5 py-3 text-paperdim">{c.description ?? '—'}</td>
                      <td className="px-5 py-3 font-garamond text-xs text-paperdim/70">
                        {c.updatedAt ?? c.createdAt}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          {manageable && (
                            <button
                              type="button"
                              className="btn-ghost !px-3 !py-1.5 text-xs"
                              onClick={() => openEdit(c)}
                            >
                              {t('systemConfig.edit')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}

      {showForm && manageable && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6" onClick={closeForm}>
          <div
            className="card animate-fade-up w-full max-w-lg p-6"
            role="dialog"
            aria-modal="true"
            aria-label={t('systemConfig.editTitle')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">{t('systemConfig.editTitle')}</h2>
              <button
                type="button"
                aria-label={t('common.close')}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-paperedge/40 text-paperdim transition hover:border-cinnabar hover:text-cinnabarlight"
                onClick={closeForm}
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-paperdim/50">
              {t('systemConfig.keyNotModifiable', { key: editing.key })}
            </p>
            <div className="mt-5 grid gap-4">
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('systemConfig.value')}
                <input
                  className="input"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={t('systemConfig.valuePlaceholder')}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('systemConfig.description')}
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('systemConfig.descriptionPlaceholder')}
                />
              </label>
            </div>
            {error && (
              <p className="mt-4 rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-ghost" disabled={saving} onClick={closeForm}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? t('common.saveInProgress') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
