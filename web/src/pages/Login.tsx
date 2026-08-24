import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuth((s) => s.setAuth)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await api.login({ account, password })
      setAuth(data.token, data.user)
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ink-hero flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="card animate-fade-up w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[0.3em] text-paper">登 录</h1>
          <p className="mt-2 font-garamond text-xs italic text-bronzelight">Sign in to contribute</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="label" htmlFor="account">邮箱 / 用户名</label>
            <input
              id="account"
              className="input"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="rounded-sm border border-cinnabar/50 bg-cinnabar/10 px-3 py-2 text-sm text-cinnabarlight">{error}</p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? '登录中…' : '登录'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-paperdim">
          尚无账号？
          <Link to="/register" state={location.state} className="ml-1 text-bronzelight underline underline-offset-4 hover:text-paper">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}
