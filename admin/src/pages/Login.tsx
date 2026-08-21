import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
      if (data.user.role !== 'admin') {
        setError('该账号不是管理员，无法进入后台。')
        return
      }
      setAuth(data.token, data.user)
      const from = (location.state as { from?: string } | null)?.from ?? '/reviews'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ink-hero flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card animate-fade-up w-full max-w-md p-8">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 flex-col items-center justify-center rounded-sm border-2 border-bronze bg-bronze/15 font-song text-xs font-bold leading-[1.1] tracking-widest text-bronzelight shadow-seal">
            <span>史册</span>
            <span>审校</span>
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-[0.3em] text-paper">后台管理</h1>
          <p className="mt-2 font-garamond text-xs italic text-bronzelight">HanJianNet Editorial Console</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="label" htmlFor="account">管理员账号</label>
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
        <p className="mt-6 text-center text-xs tracking-wider text-paperdim/60">仅限管理员账号登录 · 与公众站账号体系一致</p>
      </div>
    </div>
  )
}
