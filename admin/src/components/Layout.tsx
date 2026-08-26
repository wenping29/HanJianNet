import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TabsBar from './TabsBar'
import { api } from '../lib/api'
import { ROLE_LABELS, canAccessConsole } from '../lib/roles'
import { useAuth } from '../stores/auth'
import { useTabsStore } from '../stores/tabs'
import type { MenuItem, RevisionStatusStats } from '../types'

export default function Layout() {
  const { user, clear } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const addTab = useTabsStore((s) => s.addTab)
  const setActive = useTabsStore((s) => s.setActive)

  const [menus, setMenus] = useState<MenuItem[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [stats, setStats] = useState<RevisionStatusStats | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  // 组件卸载清理悬浮关闭定时器
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [])

  // 加载菜单
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

  // 加载待审统计
  useEffect(() => {
    if (!user || !canAccessConsole(user.role)) return
    let alive = true
    api
      .adminRevisionStats()
      .then((d) => {
        if (alive) setStats(d.stats)
      })
      .catch(() => {
        if (alive) setStats(null)
      })
    return () => {
      alive = false
    }
  }, [user, location.pathname])

  // 路由变化时同步标签页状态
  useEffect(() => {
    const path = location.pathname
    // 根据路径查找对应菜单标签
    let matched: MenuItem | null = null
    for (const m of menus) {
      if (m.children && m.children.length > 0) {
        for (const c of m.children) {
          if (path === c.path || path.startsWith(`${c.path}/`)) {
            matched = c
            break
          }
        }
      } else if (path === m.path || path.startsWith(`${m.path}/`)) {
        matched = m
        break
      }
      if (matched) break
    }
    if (matched) {
      const label = path.startsWith('/reviews/') ? '修订详情' : matched.label
      addTab({
        key: path.startsWith('/reviews/') ? path : matched.path,
        path,
        label,
        closable: matched.path !== '/reviews',
      })
    } else {
      // 未知路径也加入标签
      const knownTabs = useTabsStore.getState().tabs
      if (!knownTabs.some((t) => t.key === path)) {
        addTab({
          key: path,
          path,
          label: path.startsWith('/traitors/')
            ? path.endsWith('/edit')
              ? '编辑档案'
              : '档案详情'
            : '页面',
          closable: true,
        })
      } else {
        setActive(path)
      }
    }
  }, [location.pathname, menus, addTab, setActive])

  // 路由变化关闭用户菜单与移动端侧边栏
  useEffect(() => {
    setUserMenuOpen(false)
    setMobileSidebarOpen(false)
  }, [location.pathname])

  const badgeText = (n: number) => (n <= 0 ? '' : n > 99 ? '99+' : `${n}`)
  const pendingCount = stats?.pending ?? 0

  return (
    <div className="paper-texture flex h-screen min-h-screen w-full overflow-hidden bg-ink">
      {/* 左侧菜单 */}
      <Sidebar
        menus={menus}
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 右侧主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶部栏 */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-paperedge/15 bg-ink/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            {/* 桌面端收起按钮 */}
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="hidden h-9 w-9 items-center justify-center rounded-sm border border-paperedge/15 text-paperdim transition hover:bg-bronze/10 hover:text-paper lg:inline-flex"
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
            >
              <span className={`text-[14px] leading-none transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}>
                ▸
              </span>
            </button>
            {/* 移动端汉堡按钮 */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-paperedge/15 text-paperdim transition hover:bg-bronze/10 hover:text-paper lg:hidden"
              aria-label="菜单"
              aria-expanded={mobileSidebarOpen}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {mobileSidebarOpen ? (
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
            <div className="hidden items-center gap-2 text-xs tracking-[0.2em] text-bronzelight/80 lg:flex">
              <span>秉笔直书 · 去伪存真</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {user && (
              <div
                className="relative"
                onMouseEnter={() => {
                  if (closeTimerRef.current) {
                    clearTimeout(closeTimerRef.current)
                    closeTimerRef.current = null
                  }
                  setUserMenuOpen(true)
                }}
                onMouseLeave={() => {
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
                  closeTimerRef.current = window.setTimeout(() => setUserMenuOpen(false), 120)
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-sm px-2 py-1.5 transition hover:bg-paperedge/10"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => {
                    if (closeTimerRef.current) {
                      clearTimeout(closeTimerRef.current)
                      closeTimerRef.current = null
                    }
                    setUserMenuOpen((v) => !v)
                  }}
                >
                  <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-bronze/50 bg-bronze/15 font-song text-sm font-bold text-bronzelight shadow-seal">
                    {user.username.slice(0, 1).toUpperCase()}
                    {badgeText(pendingCount) && (
                      <span
                        aria-label={`待审修订 ${pendingCount} 条`}
                        className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-ink bg-cinnabar px-[5px] text-[10px] font-bold leading-none text-paper shadow-seal"
                      >
                        {badgeText(pendingCount)}
                      </span>
                    )}
                    {!badgeText(pendingCount) && (
                      <span className="absolute -bottom-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-ink bg-cinnabarlight" />
                    )}
                  </span>
                  <span className="hidden items-start text-left leading-tight lg:flex lg:flex-col">
                    <span className="text-sm text-paper">{user.username}</span>
                    <span className="text-[11px] tracking-[0.2em] text-bronzelight">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-[10px] leading-none text-paperdim/70 transition ${
                      userMenuOpen ? 'translate-y-[1px] text-paper' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>
                <div
                  role="menu"
                  className={`absolute right-0 top-full z-50 w-60 max-w-[calc(100vw-1.5rem)] pt-2 transition-all duration-150 ${
                    userMenuOpen
                      ? 'pointer-events-auto visible opacity-100 translate-y-0'
                      : 'pointer-events-none invisible opacity-0 translate-y-1'
                  }`}
                >
                  <div className="card overflow-hidden shadow-seal">
                    <div className="flex items-center gap-3 border-b border-paperedge/15 bg-inksoft/40 px-4 py-3">
                      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-bronze/50 bg-bronze/15 font-song text-base font-bold text-bronzelight">
                        {user.username.slice(0, 1).toUpperCase()}
                        {badgeText(pendingCount) && (
                          <span
                            aria-label={`待审修订 ${pendingCount} 条`}
                            className="absolute -right-1.5 -top-1.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-inksoft bg-cinnabar px-[5px] text-[10px] font-bold leading-none text-paper shadow-seal"
                          >
                            {badgeText(pendingCount)}
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-paper">{user.username}</p>
                        <p className="truncate text-xs tracking-wider text-paperdim/70">{user.email}</p>
                        <p className="mt-0.5 text-[11px] tracking-[0.2em] text-bronzelight">
                          {ROLE_LABELS[user.role]}
                        </p>
                      </div>
                    </div>
                    <div className="py-1.5">
                      {canAccessConsole(user.role) && (
                        <Link
                          to="/reviews"
                          role="menuitem"
                          className="flex items-center justify-between px-4 py-2 text-sm tracking-[0.15em] text-paperdim transition hover:bg-bronze/15 hover:text-paper"
                          onClick={() => {
                            setUserMenuOpen(false)
                            addTab({ key: '/reviews', path: '/reviews', label: '待审修订', closable: false })
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <span aria-hidden="true" className="w-4 text-center text-xs text-bronzelight">◷</span>
                            待审修订
                          </span>
                          {pendingCount > 0 && (
                            <span className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cinnabar/90 px-[6px] text-[10px] font-bold text-paper shadow-seal">
                              {badgeText(pendingCount)}
                            </span>
                          )}
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2 text-sm tracking-[0.15em] text-paperdim transition hover:bg-bronze/15 hover:text-paper"
                        onClick={() => {
                          setUserMenuOpen(false)
                          addTab({ key: '/profile', path: '/profile', label: '个人信息', closable: true })
                        }}
                      >
                        <span aria-hidden="true" className="w-4 text-center text-xs text-bronzelight">◉</span>
                        个人信息
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm tracking-[0.15em] text-cinnabarlight/90 transition hover:bg-cinnabar/15 hover:text-cinnabarlight"
                        onClick={() => {
                          setUserMenuOpen(false)
                          clear()
                          navigate('/login', { replace: true })
                        }}
                      >
                        <span aria-hidden="true" className="w-4 text-center text-xs">⏻</span>
                        退出登录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 标签页栏 */}
        <TabsBar />

        {/* 主内容区 */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="container-page py-6">
            <Outlet />
          </div>
        </main>

        {/* 页脚 */}
        <footer className="flex-shrink-0 border-t border-paperedge/15 bg-inksoft/60">
          <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs tracking-wider text-paperdim/70 sm:flex-row">
            <span>汉奸档案 · 后台管理 — 秉笔直书，去伪存真</span>
            <span className="font-garamond italic">Editorial Console · Est. 2026</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
