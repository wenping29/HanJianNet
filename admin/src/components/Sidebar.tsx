import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuItem } from '../types'
import { useTabsStore } from '../stores/tabs'

interface SidebarProps {
  menus: MenuItem[]
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
}

function MenuIcon({ label }: { label: string }) {
  const ch = label.trim().charAt(0) || '■'
  return (
    <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm border border-bronze/40 bg-bronze/10 text-[11px] font-bold text-bronzelight">
      {ch}
    </span>
  )
}

export default function Sidebar({ menus, collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const addTab = useTabsStore((s) => s.addTab)
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  const toggleGroup = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const isGroupActive = (m: MenuItem) =>
    m.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(`${c.path}/`)) ?? false

  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const handleClick = (item: MenuItem) => {
    addTab({
      key: item.path,
      path: item.path,
      label: item.label,
      closable: item.path !== '/reviews',
    })
    navigate(item.path)
    onCloseMobile()
  }

  // 移动端固定完整宽度，桌面端按 collapsed 决定
  const w = collapsed ? 'w-[232px] lg:w-[68px]' : 'w-[232px]'
  // collapsed 时文字/子菜单在桌面端隐藏，移动端始终显示
  const textHideCls = collapsed ? 'lg:hidden' : ''

  return (
    <>
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-shrink-0 flex-col border-r border-paperedge/15 bg-inksoft/95 backdrop-blur transition-transform duration-300 lg:relative lg:bg-inksoft/40 lg:transition-all lg:duration-300 ${w} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Logo 区 */}
      <div className={`flex h-16 items-center gap-3 border-b border-paperedge/15 px-4 ${collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : ''}`}>
        <span className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-sm border-2 border-bronze bg-bronze/15 font-song text-[11px] font-bold leading-[1.1] tracking-widest text-bronzelight shadow-seal">
          <span>史册</span>
          <span>审校</span>
        </span>
        <div className={`flex min-w-0 flex-col leading-tight ${textHideCls}`}>
          <span className="truncate text-base font-semibold tracking-[0.25em] text-paper">汉奸档案</span>
          <span className="truncate font-garamond text-[11px] italic tracking-wider text-bronzelight">Admin Console</span>
        </div>
      </div>

      {/* 菜单区 */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {menus.map((m) => {
          const hasChildren = m.children && m.children.length > 0
          const groupOpen = openKeys[m.key] ?? isGroupActive(m)
          const groupActive = isGroupActive(m)

          if (hasChildren) {
            return (
              <div key={m.key} className="mb-1">
                <button
                  type="button"
                  onClick={() => !collapsed ? toggleGroup(m.key) : undefined}
                  title={collapsed ? m.label : undefined}
                  className={`group flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${
                    collapsed ? 'lg:justify-center' : ''
                  } ${groupActive ? 'text-cinnabarlight' : 'text-paperdim hover:bg-bronze/10 hover:text-paper'}`}
                >
                  <MenuIcon label={m.label} />
                  <span style={{ display: 'inline-flex' }} className={`flex-1 truncate tracking-[0.2em] ${textHideCls}`}>{m.label}</span>
                  <span
                    className={`text-[10px] leading-none text-paperdim/60 transition-transform duration-200 ${textHideCls} ${
                      groupOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ▸
                  </span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${textHideCls} ${
                    groupOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-4 border-l border-paperedge/15 pl-2">
                    {m.children!.map((c) => {
                      const active = isItemActive(c.path)
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleClick(c)}
                          className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm transition ${
                            active
                              ? 'bg-cinnabar/15 text-cinnabarlight'
                              : 'text-paperdim/80 hover:bg-bronze/10 hover:text-paper'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${active ? 'bg-cinnabarlight' : 'bg-paperdim/30'}`} />
                          <span className="truncate tracking-[0.15em]">{c.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {collapsed && (
                  <div className="relative group/hover hidden lg:block">
                    <div className="invisible absolute left-full top-0 z-50 ml-2 w-48 rounded-sm border border-paperedge/20 bg-inkcard py-2 opacity-0 shadow-seal transition-all duration-150 group-hover/hover:visible group-hover/hover:opacity-100">
                      <div className="border-b border-paperedge/10 px-3 pb-2 mb-1">
                        <span className="text-xs tracking-[0.2em] text-bronzelight">{m.label}</span>
                      </div>
                      {m.children!.map((c) => {
                        const active = isItemActive(c.path)
                        return (
                          <button
                            key={c.key}
                            type="button"
                            onClick={() => handleClick(c)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                              active ? 'bg-cinnabar/15 text-cinnabarlight' : 'text-paperdim hover:bg-bronze/10 hover:text-paper'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-cinnabarlight' : 'bg-paperdim/30'}`} />
                            <span className="truncate tracking-[0.15em]">{c.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          }

          const active = isItemActive(m.path)
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => handleClick(m)}
              title={collapsed ? m.label : undefined}
              className={`group mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm transition ${
                collapsed ? 'lg:justify-center' : ''
              } ${active ? 'bg-cinnabar/15 text-cinnabarlight' : 'text-paperdim hover:bg-bronze/10 hover:text-paper'}`}
            >
              <MenuIcon label={m.label} />
              <span style={{ display: 'inline-flex' }} className={`flex-1 truncate tracking-[0.2em] ${textHideCls}`}>{m.label}</span>
            </button>
          )
        })}
      </nav>

      {/* 底部收缩按钮：仅桌面端显示 */}
      <div className="hidden border-t border-paperedge/15 p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-sm px-2 py-2 text-xs tracking-[0.2em] text-paperdim/70 transition hover:bg-bronze/10 hover:text-paper"
        >
          <span className={`text-[14px] leading-none transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
            ◂
          </span>
          {!collapsed && <span>收 起 菜 单</span>}
        </button>
      </div>

      {/* 移动端关闭按钮：仅移动端显示 */}
      <div className="border-t border-paperedge/15 p-2 lg:hidden">
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex w-full items-center justify-center gap-2 rounded-sm px-2 py-2.5 text-xs tracking-[0.2em] text-paperdim/70 transition hover:bg-bronze/10 hover:text-paper"
        >
          收 起 菜 单
        </button>
      </div>
    </aside>
    </>
  )
}
