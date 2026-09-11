import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { canAccessConsole } from '../lib/roles'
import { useAuth } from '../stores/auth'

export default function ProtectedRoute() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!canAccessConsole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold tracking-[0.3em] text-cinnabarlight">{t('noAccess.forbidden')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-paperdim">{t('noAccess.forbiddenDesc')}</p>
          <button type="button" className="btn-ghost mt-6" onClick={() => useAuth.getState().clear()}>
            {t('noAccess.switchAccount')}
          </button>
        </div>
      </div>
    )
  }
  return <Outlet />
}
