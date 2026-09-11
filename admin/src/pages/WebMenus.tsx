import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      flash(t(!m.isEnabled ? 'webMenus.enableSuccess' : 'webMenus.disableSuccess', { label: m.label }))
    } catch {
      setItems(prev)
      setError(t('webMenus.operationFailed'))
    }
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await api.updateWebMenu(editing.id, form)
      flash(t('webMenus.updateSuccess', { label: form.label }))
      setShowForm(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('webMenus.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const manageable = canManageUsers(me.role)

  return (
    <div className="container-page py-10">
      <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('webMenus.title')}</h1>
          <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">Web Menu Configuration</p>
        </div>
        <p className="text-xs leading-relaxed text-paperdim/70">
          {t('webMenus.description')}
          <br />
          {t('webMenus.hint')}
        </p>
      </header>

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
          <p className="font-song text-lg tracking-widest text-paperdim/70">{t('webMenus.noData')}</p>
          <p className="mt-2 text-xs text-paperdim/50">{t('webMenus.startBackend')}</p>
        </div>
      ) : (
        <div className="card animate-fade-up mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-paperedge/20 text-xs uppercase tracking-widest text-paperdim/70">
                <th className="px-5 py-3 font-medium">{t('webMenus.identifier')}</th>
                <th className="px-5 py-3 font-medium">{t('webMenus.label')}</th>
                <th className="px-5 py-3 font-medium">{t('webMenus.path')}</th>
                <th className="px-5 py-3 font-medium">{t('webMenus.sort')}</th>
                <th className="px-5 py-3 font-medium">{t('webMenus.status')}</th>
                <th className="px-5 py-3 text-right font-medium">{t('common.operation')}</th>
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
                        title={m.isEnabled ? t('webMenus.clickToDisable') : t('webMenus.clickToEnable')}
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
                        {m.isEnabled ? t('common.enable') : t('common.disable')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      {manageable && (
                        <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => openEdit(m)}>
                          {t('webMenus.editMenu')}
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
            aria-label={t('webMenus.editTitle')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">{t('webMenus.editTitle')}</h2>
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
              {t('webMenus.identifierNotModifiable', { key: editing.key })}
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('webMenus.label')}
                <input
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder={t('webMenus.labelPlaceholder')}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('webMenus.path')}
                <input
                  className="input"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="/"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('webMenus.sort')}
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.sort}
                  onChange={(e) => setForm({ ...form, sort: Number(e.target.value) || 0 })}
                />
              </label>
              <div className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
                {t('webMenus.status')}
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
                    {form.isEnabled ? t('common.enable') : t('common.disable')}
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
