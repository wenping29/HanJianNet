import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Menus from './pages/Menus'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import ReviewDetail from './pages/ReviewDetail'
import Reviews from './pages/Reviews'
import Roles from './pages/Roles'
import Traitors from './pages/Traitors'
import Users from './pages/Users'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/reviews" replace />} />
          <Route path="/traitors" element={<Traitors />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/:rid" element={<ReviewDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/menus" element={<Menus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}
