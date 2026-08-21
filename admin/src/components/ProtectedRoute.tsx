import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'

export default function ProtectedRoute() {
  const user = useAuth((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold tracking-[0.3em] text-cinnabarlight">无权访问</h1>
          <p className="mt-3 text-sm leading-relaxed text-paperdim">此后台仅限管理员使用，当前账号不具备管理员权限。</p>
          <button type="button" className="btn-ghost mt-6" onClick={() => useAuth.getState().clear()}>
            切换账号
          </button>
        </div>
      </div>
    )
  }
  return <Outlet />
}
