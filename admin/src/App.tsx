import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Menus from './pages/Menus'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import ReviewDetail from './pages/ReviewDetail'
import Reviews from './pages/Reviews'
import Roles from './pages/Roles'
import TraitorEditor from './pages/TraitorEditor'
import Traitors from './pages/Traitors'
import Users from './pages/Users'
import WebMenus from './pages/WebMenus'
import { canManageUsers } from './lib/roles'
import { useAuth } from './stores/auth'

function AdminOnlyRoute() {
  const user = useAuth((s) => s.user)
  if (!user || !canManageUsers(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold tracking-[0.3em] text-cinnabarlight">无权操作档案</h1>
          <p className="mt-3 text-sm leading-relaxed text-paperdim">新增/编辑档案仅限管理员（admin 及以上）角色使用。</p>
        </div>
      </div>
    )
  }
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/reviews" replace />} />
          <Route path="/traitors" element={<Traitors />} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="/traitors/new" element={<TraitorEditor mode="create" />} />
            <Route path="/traitors/:id/edit" element={<TraitorEditor mode="edit" />} />
          </Route>
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:rid" element={<ReviewDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/web-menus" element={<WebMenus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
