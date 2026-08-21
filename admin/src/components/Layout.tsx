import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ROLE_LABELS } from '../lib/roles'
import { useAuth } from '../stores/auth'
import type { MenuItem } from '../types'

export default function Layout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()
  const [menus, setMenus] = useState<MenuItem[]>([])

  useEffect(() => {
    let alive = true
    api
      .menus()
      .then((data) => {
        if (alive) setMenus(data.items)
      })
      .catch(() => {
        if (alive) setMenus([])
      })
    return () => {
      alive = false
    }
  }, [])

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `px-1 py-2 text-sm tracking-[0.25em] transition hover:text-paper ${
      isActive ? 'text-cinnabarlight' : 'text-paperdim'
    }`

  return (
    <div className="paper-texture flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-40 border-b border-paperedge/15 bg-ink/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/reviews" className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-col items-center justify-center rounded-sm border-2 border-bronze bg-bronze/15 font-song text-[11px] font-bold leading-[1.1] tracking-widest text-bronzelight shadow-seal">
              <span>史册</span>
              <span>审校</span>
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-lg font-semibold tracking-[0.3em] text-paper">汉奸档案 · 后台</span>
              <span className="font-garamond text-xs italic tracking-wider text-bronzelight">HanJianNet Admin</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {menus.map((m) => (
              <NavLink key={m.key} to={m.path} className={navCls}>
                {m.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <NavLink to="/profile" className="hidden items-center gap-2 text-sm text-paperdim transition hover:text-paper sm:flex">
                  <span className="inline-block h-2 w-2 rounded-full bg-cinnabarlight" />
                  {user.username}
                </NavLink>
                <span className="badge border-bronze/60 bg-bronze/15 text-bronzelight">
                  {ROLE_LABELS[user.role]}
                </span>
                <button
                  type="button"
                  className="btn-ghost !px-4 !py-2"
                  onClick={() => {
                    clear()
                    navigate('/login')
                  }}
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-paperedge/15 bg-inksoft/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs tracking-wider text-paperdim/70 sm:flex-row">
          <span>汉奸档案 · 后台管理 — 秉笔直书，去伪存真</span>
          <span className="font-garamond italic">Editorial Console · Est. 2026</span>
        </div>
      </footer>
    </div>
  )
}
