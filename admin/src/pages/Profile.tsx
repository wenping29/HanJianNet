import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../stores/auth'

export default function Profile() {
  const { t } = useTranslation()
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
      setProfileMsg(t('profile.updateSuccess'))
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : t('profile.updateFailed'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePassword = async () => {
    setPwdErr('')
    setPwdMsg('')
    if (pwd.newPassword !== pwd.confirm) {
      setPwdErr(t('profile.passwordMismatch'))
      return
    }
    setSavingPwd(true)
    try {
      await api.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      setPwdMsg(t('profile.passwordChanged'))
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (e) {
      setPwdErr(e instanceof Error ? e.message : t('profile.passwordChangeFailed'))
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-[0.25em] text-paper">{t('profile.title')}</h1>
        <p className="mt-1 font-garamond text-xs italic tracking-wider text-bronzelight">My Profile</p>
      </header>

      <section className="card animate-fade-up mt-6 p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-paperdim">
          <span>
            {t('profile.usernameLabel')}<span className="text-paper">{user.username}</span>
          </span>
          <span>
            {t('profile.roleLabel')}<span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">{ROLE_LABELS[user.role]}</span>
          </span>
          <span className="font-garamond text-xs text-paperdim/70">
            {t('profile.registeredAt', { date: new Date(user.createdAt).toLocaleDateString() })}
          </span>
        </div>

        <h2 className="mt-6 text-sm font-semibold tracking-[0.25em] text-paper">{t('profile.basicInfo')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            {t('profile.username')}
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            {t('profile.email')}
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
          {savingProfile ? t('common.saveInProgress') : t('common.saveBasicInfo')}
        </button>
      </section>

      <section className="card animate-fade-up mt-6 p-6">
        <h2 className="text-sm font-semibold tracking-[0.25em] text-paper">{t('profile.changePassword')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            {t('profile.currentPassword')}
            <input
              className="input"
              type="password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            {t('profile.newPassword')}
            <input
              className="input"
              type="password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-widest text-paperdim">
            {t('profile.confirmNewPassword')}
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
          {savingPwd ? t('common.submitInProgress') : t('profile.changePassword')}
        </button>
      </section>
    </div>
  )
}
