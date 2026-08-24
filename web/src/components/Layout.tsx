import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/auth'

function SealLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 flex-col items-center justify-center rounded-sm border-2 border-cinnabar bg-cinnabar/15 font-song text-[11px] font-bold leading-[1.1] tracking-widest text-cinnabarlight shadow-seal">
        <span>汉奸</span>
        <span>档案</span>
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-lg font-semibold tracking-[0.3em] text-paper">汉奸档案</span>
        <span className="font-garamond text-xs italic tracking-wider text-bronzelight">HanJianNet Archives</span>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `px-1 py-2 text-sm tracking-[0.25em] transition hover:text-paper ${
      isActive ? 'text-cinnabarlight' : 'text-paperdim'
    }`

  return (
    <div className="paper-texture flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-40 border-b border-paperedge/15 bg-ink/85 backdrop-blur">
        <div className="container-page flex h-16 items-center">
          <div className="flex flex-1 items-center justify-start">
            <SealLogo />
          </div>
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <NavLink to="/" end className={navCls}>
              首页
            </NavLink>
            <NavLink to="/timeline" className={navCls}>
              事件时光轴
            </NavLink>
            <NavLink to="/events" className={navCls}>
              历史事件
            </NavLink>
            <NavLink to="/about" className={navCls}>
              关于
            </NavLink>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="btn-ghost !px-3 !py-2"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-bamboolight" />
                  {user.username}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-sm border border-paperedge/20 bg-inkcard shadow-card">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-paperdim hover:bg-cinnabar/15 hover:text-paper"
                    >
                      个人中心
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clear()
                        setMenuOpen(false)
                        navigate('/')
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-paperdim hover:bg-cinnabar/15 hover:text-paper"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost !px-4 !py-2">
                  登录
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2">
                  注册
                </Link>
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
          <span>汉奸档案 · HanJianNet — 以史为鉴，勿忘国耻</span>
          <span className="font-garamond italic">Editorial Archive · Est. 2026</span>
        </div>
      </footer>
    </div>
  )
}
