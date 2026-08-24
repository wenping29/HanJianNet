import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'

export default function ProtectedRoute() {
  const user = useAuth((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
