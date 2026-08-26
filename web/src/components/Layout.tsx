import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import type { Revision, WebMenu } from '../types'
import { headerMenuItemStyle,footerContainerPageStyle } from '../style'

/** 后端不可用时的兜底菜单 */
const FALLBACK_MENUS: WebMenu[] = [
  { id: 'fb1', key: 'home', path: '/', label: '首页', sort: 1, isEnabled: true },
  { id: 'fb2', key: 'lookup', path: '/lookup', label: '查询', sort: 2, isEnabled: true },
  { id: 'fb3', key: 'map', path: '/map', label: '汉奸地图', sort: 3, isEnabled: true },
  { id: 'fb4', key: 'timeline', path: '/timeline', label: '时光轴', sort: 4, isEnabled: true },
  { id: 'fb5', key: 'roster', path: '/roster', label: '名录', sort: 5, isEnabled: true },
  { id: 'fb6', key: 'events', path: '/events', label: '事件', sort: 6, isEnabled: true },
  { id: 'fb7', key: 'about', path: '/about', label: '关于', sort: 7, isEnabled: true },
]

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
  const location = useLocation()
  const [hoverOpen, setHoverOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [menus, setMenus] = useState<WebMenu[]>(FALLBACK_MENUS)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 路由切换时自动收起移动端菜单
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // 加载前台菜单
  useEffect(() => {
    let cancelled = false
    api
      .listWebMenus()
      .then((r) => {
        if (cancelled) return
        if (r.items.length > 0) setMenus(r.items)
      })
      .catch(() => {
        // 后端不可用时保留兜底菜单
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 获取通知数量：已审核（approved/rejected）的提交记录数
  useEffect(() => {
    if (!user) {
      setNotifCount(0)
      return
    }
    let cancelled = false
    api
      .mySubmissions()
      .then((r) => {
        if (cancelled) return
        const reviewed = r.items.filter(
          (rev: Revision) => rev.status === 'approved' || rev.status === 'rejected',
        )
        setNotifCount(reviewed.length)
      })
      .catch(() => {
        if (!cancelled) setNotifCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  function openMenu() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setHoverOpen(true)
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setHoverOpen(false), 150)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `px-1 py-2 text-sm tracking-[0.25em] transition hover:text-paper ${
      isActive ? 'text-cinnabarlight' : 'text-paperdim'
    }`

  return (
    <div className="paper-texture flex min-h-screen flex-col bg-ink">
      <header className="sticky top-0 z-40 border-b border-paperedge/15 bg-ink/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-2">
          {/* 左：印章 Logo */}
          <div className="flex shrink-0 items-center">
            <SealLogo />
          </div>

          {/* 中：桌面导航（≥1024px 显示） */}
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
            {menus.map((m) => (
              <NavLink
                key={m.id}
                style={headerMenuItemStyle}
                to={m.path}
                end={m.path === '/'}
                className={navCls}
              >
                {m.label}
              </NavLink>
            ))}
          </nav>

          {/* 右：桌面用户区（≥1024px 显示） */}
          <div className="hidden shrink-0 items-center justify-end gap-3 lg:flex">
            {user ? (
              <div
                className="relative"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
              >
                <button type="button" className="flex items-center gap-2.5 rounded-sm py-1.5 pl-1.5 pr-3 transition hover:bg-paperedge/10">
                  {/* 头像 */}
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-cinnabar/60 bg-cinnabar/20 font-song text-sm font-bold text-cinnabarlight">
                    {user.username.slice(0, 1).toUpperCase()}
                    {/* 通知数量徽标 */}
                    {notifCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-ink bg-cinnabar px-1 font-garamond text-[10px] font-bold leading-none text-paper">
                        {notifCount > 99 ? '99+' : notifCount}
                      </span>
                    )}
                  </span>
                  <span className="text-sm tracking-wider text-paperdim transition hover:text-paper">
                    {user.username}
                  </span>
                </button>

                {/* 悬浮弹框 */}
                {hoverOpen && (
                  <div className="absolute right-0 top-full w-48 overflow-hidden rounded-sm border border-paperedge/20 bg-inkcard pt-1 shadow-card">
                    {/* 通知条 */}
                    <div className="flex items-center justify-between border-b border-paperedge/10 px-4 py-2.5">
                      <span className="text-xs tracking-widest text-paperdim">审核通知</span>
                      <span className="font-garamond text-xs font-bold text-cinnabarlight">
                        {notifCount > 0 ? `${notifCount} 条未读` : '无新通知'}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setHoverOpen(false)}
                      className="block px-4 py-2.5 text-sm text-paperdim transition hover:bg-cinnabar/15 hover:text-paper"
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setHoverOpen(false)}
                      className="block px-4 py-2.5 text-sm text-paperdim transition hover:bg-cinnabar/15 hover:text-paper"
                    >
                      我的提交
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clear()
                        setHoverOpen(false)
                        navigate('/')
                      }}
                      className="block w-full border-t border-paperedge/10 px-4 py-2.5 text-left text-sm text-paperdim transition hover:bg-cinnabar/15 hover:text-paper"
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

          {/* 移动端汉堡按钮（<1024px 显示） */}
          <button
            type="button"
            aria-label="菜单"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-paperedge/25 text-paperdim transition hover:border-bronzelight hover:text-paper lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* 移动端导航抽屉：从 header 下方滑出，不遮挡 header 本身 */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-x-0 bottom-0 top-16 z-40 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-paperedge/15 bg-inkcard shadow-card animate-fade-up">
            <nav className="container-page flex flex-col py-2">
              {menus.map((m) => (
                <NavLink
                  key={m.id}
                  to={m.path}
                  end={m.path === '/'}
                  className={({ isActive }) =>
                    `border-b border-paperedge/10 px-2 py-3 text-sm tracking-[0.25em] transition ${
                      isActive ? 'text-cinnabarlight' : 'text-paperdim hover:text-paper'
                    }`
                  }
                >
                  {m.label}
                </NavLink>
              ))}

              {/* 用户操作区 */}
              <div className="mt-2 flex flex-col gap-2 border-t border-paperedge/15 px-2 py-3">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-1 py-1">
                      <span className="flex items-center gap-2 text-sm tracking-wider text-paper">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cinnabar/60 bg-cinnabar/20 font-song text-xs font-bold text-cinnabarlight">
                          {user.username.slice(0, 1).toUpperCase()}
                        </span>
                        {user.username}
                      </span>
                      {notifCount > 0 && (
                        <span className="font-garamond text-xs text-cinnabarlight">
                          {notifCount > 99 ? '99+' : notifCount} 条审核通知
                        </span>
                      )}
                    </div>
                    <Link to="/profile" className="btn-ghost w-full !py-2 text-left text-sm">
                      个人中心
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clear()
                        navigate('/')
                      }}
                      className="btn-bronze w-full !py-2 text-sm"
                    >
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <Link to="/login" className="btn-ghost flex-1 !py-2.5">
                      登录
                    </Link>
                    <Link to="/register" className="btn-primary flex-1 !py-2.5">
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-paperedge/15 bg-inksoft/60">
        <div style={footerContainerPageStyle} className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs tracking-wider text-paperdim/70 sm:flex-row">
          <span>汉奸档案 · HanJianNet — 以史为鉴，勿忘国耻</span>
          <span className="font-garamond italic">Editorial Archive · Est. 2026</span>
        </div>
      </footer>
    </div>
  )
}
