import { useState } from 'react'
import { api } from '../lib/api'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../stores/auth'

export default function Profile() {
  const { user, setAuth } = useAuth()
  const token = useAuth((s) => s.token)

  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')

  if (!user) return null

  const handleProfile = async () => {
    setSavingProfile(true)
    setProfileErr('')
    setProfileMsg('')
    try {
      const data = await api.updateProfile(form)
      if (token) setAuth(token, data.user)
      setProfileMsg('个人信息已更新')
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePassword = async () => {
    setPwdErr('')
    setPwdMsg('')
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr('两次输入的新密码不一致')
      return
    }
    setSavingPwd(true)
    try {
      await api.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      setPwdMsg('密码修改成功')
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : '密码修改失败')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">个人信息</h1>
        <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">My Profile</p>
      </header>

      <section className="card animate-fade-up mt-6 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-paperdim">
          <span>
            用户名：<span className="text-paper">{user.username}</span>
          </span>
          <span>
            角色：<span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{ROLE_LABELS[user.role]}</span>
          </span>
          <span className="font-garamond text-xs text-paperdim/70">注册于 {new Date(user.createdAt).toLocaleDateString()}</span>
        </div>

        <h2 className="mt-6 text-sm font-semibold tracking-[0.25em] text-paper">基本信息</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            用户名
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            邮箱
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
        </div>
        {profileMsg && <p className="mt-3 text-sm text-bronzelight">{profileMsg}</p>}
        {profileErr && <p className="mt-3 text-sm text-cinnabarlight">{profileErr}</p>}
        <button type="button" className="btn-primary mt-4" disabled={savingProfile} onClick={handleProfile}>
          {savingProfile ? '保存中…' : '保存基本信息'}
        </button>
      </section>

      <section className="card animate-fade-up mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">修改密码</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            当前密码
            <input
              className="input"
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            新密码（至少 8 位）
            <input
              className="input"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            确认新密码
            <input
              className="input"
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </label>
        </div>
        {pwdMsg && <p className="mt-3 text-sm text-bronzelight">{pwdMsg}</p>}
        {pwdErr && <p className="mt-3 text-sm text-cinnabarlight">{pwdErr}</p>}
        <button type="button" className="btn-primary mt-4" disabled={savingPwd} onClick={handlePassword}>
          {savingPwd ? '提交中…' : '修改密码'}
        </button>
      </section>
    </div>
  )
}
