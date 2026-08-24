import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import type { Revision } from '../types'
import { headerMenuItemStyle } from '../style'

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
  const [hoverOpen, setHoverOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        <div className="container-page flex h-16 items-center">
          <div className="flex flex-1 items-center justify-start">
            <SealLogo />
          </div>
          <nav className="hidden flex-1 items-center justify-center gap-8 md:flex">
            <NavLink style={headerMenuItemStyle} to="/" end className={navCls}>
              首页
            </NavLink>
            <NavLink style={headerMenuItemStyle} to="/timeline" className={navCls}>
              时光轴
            </NavLink>
            <NavLink style={headerMenuItemStyle} to="/roster" className={navCls}>
              名录
            </NavLink>
            <NavLink style={headerMenuItemStyle} to="/events" className={navCls}>
              事件
            </NavLink>
            <NavLink style={headerMenuItemStyle} to="/about" className={navCls}>
              关于
            </NavLink>
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3">
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
