import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuth((s) => s.setAuth)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }
    if (form.password !== form.confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      const data = await api.register({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      setAuth(data.token, data.user)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ink-hero flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="card animate-fade-up w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[0.3em] text-paper">{t('auth.registerTitle')}</h1>
          <p className="mt-2 font-garamond text-xs italic text-bronzelight">Join the compilation</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="label" htmlFor="username">{t('auth.username')}</label>
            <input
              id="username"
              className="input"
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="reg-password">{t('auth.passwordMin')}</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">{t('auth.confirmPassword')}</label>
            <input
              id="confirm"
              type="password"
              className="input"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? t('auth.registering') : t('auth.register')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-paperdim">
          {t('auth.hasAccount')}
          <Link to="/login" state={location.state} className="ml-1 text-bronzelight underline underline-offset-4 hover:text-paper">
            {t('auth.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
