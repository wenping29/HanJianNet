import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabsStore } from '../stores/tabs'

export default function TabsBar() {
  const navigate = useNavigate()
  const tabs = useTabsStore((s) => s.tabs)
  const activeKey = useTabsStore((s) => s.activeKey)
  const setActive = useTabsStore((s) => s.setActive)
  const removeTab = useTabsStore((s) => s.removeTab)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // 路由变化时同步激活标签
  useEffect(() => {
    const active = tabs.find((t) => t.key === activeKey)
    if (active && window.location.pathname !== active.path) {
      navigate(active.path, { replace: false })
    }
  }, [activeKey, tabs, navigate])

  const scrollToActive = () => {
    requestAnimationFrame(() => {
      const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-tab-key="${activeKey}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
  }

  useEffect(() => {
    scrollToActive()
  }, [activeKey, tabs.length])

  const handleClose = (e: React.MouseEvent, key: string) => {
    e.stopPropagation()
    removeTab(key)
  }

  return (
    <div className="relative border-b border-paperedge/15 bg-inksoft/30">
      <div
        ref={scrollerRef}
        className="no-scrollbar flex h-[42px] items-end gap-1 overflow-x-auto px-3 pt-1"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey
          return (
            <button
              key={tab.key}
              type="button"
              data-tab-key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`group relative flex h-[34px] flex-shrink-0 items-center gap-2 rounded-t-sm border border-b-transparent px-3 text-sm transition lg:px-4 ${
                active
                  ? 'border-paperedge/20 border-b-0 bg-ink text-paper shadow-[0_-1px_0_0_#d97757_inset]'
                  : 'border-transparent text-paperdim/80 hover:bg-bronze/5 hover:text-paper'
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  active ? 'bg-cinnabarlight' : 'bg-paperdim/30'
                }`}
              />
              <span className="max-w-[100px] truncate tracking-[0.15em] lg:max-w-[140px]">{tab.label}</span>
              {tab.closable && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleClose(e, tab.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleClose(e as unknown as React.MouseEvent, tab.key)
                  }}
                  className={`ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none transition ${
                    active
                      ? 'text-paperdim/60 hover:bg-cinnabar/20 hover:text-cinnabarlight'
                      : 'text-transparent group-hover:text-paperdim/60 group-hover:hover:bg-cinnabar/20 group-hover:hover:text-cinnabarlight'
                  }`}
                  aria-label={`关闭 ${tab.label}`}
                >
                  ✕
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
