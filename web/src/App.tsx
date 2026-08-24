import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import About from './pages/About'
import EventTimeline from './pages/EventTimeline'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Register from './pages/Register'
import TraitorDetail from './pages/TraitorDetail'
import TraitorForm from './pages/TraitorForm'
import TraitorHistory from './pages/TraitorHistory'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/traitor/:id" element={<TraitorDetail />} />
        <Route path="/traitor/:id/history" element={<TraitorHistory />} />
        <Route path="/about" element={<About />} />
        <Route path="/timeline" element={<EventTimeline />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/submit" element={<TraitorForm mode="create" />} />
          <Route path="/traitor/:id/edit" element={<TraitorForm mode="edit" />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
