import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TabItem {
  key: string
  path: string
  label: string
  closable: boolean
}

interface TabsState {
  tabs: TabItem[]
  activeKey: string
  addTab: (tab: TabItem) => void
  removeTab: (key: string) => void
  setActive: (key: string) => void
  clearAll: () => void
}

const DEFAULT_TAB: TabItem = {
  key: '/reviews',
  path: '/reviews',
  label: '待审修订',
  closable: false,
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [DEFAULT_TAB],
      activeKey: DEFAULT_TAB.key,

      addTab: (tab) => {
        const { tabs, activeKey } = get()
        const exists = tabs.some((t) => t.key === tab.key)
        if (!exists) {
          set({ tabs: [...tabs, tab], activeKey: tab.key })
        } else if (activeKey !== tab.key) {
          set({ activeKey: tab.key })
        }
      },

      removeTab: (key) => {
        const { tabs, activeKey } = get()
        const target = tabs.find((t) => t.key === key)
        if (!target || !target.closable) return
        const idx = tabs.findIndex((t) => t.key === key)
        const next = tabs.filter((t) => t.key !== key)
        let nextActive = activeKey
        if (activeKey === key) {
          if (next.length === 0) {
            nextActive = DEFAULT_TAB.key
          } else {
            const neighbor = next[idx] || next[idx - 1] || next[0]
            nextActive = neighbor.key
          }
        }
        if (next.length === 0) {
          set({ tabs: [DEFAULT_TAB], activeKey: DEFAULT_TAB.key })
        } else {
          set({ tabs: next, activeKey: nextActive })
        }
      },

      setActive: (key) => {
        const { tabs } = get()
        if (tabs.some((t) => t.key === key)) {
          set({ activeKey: key })
        }
      },

      clearAll: () => set({ tabs: [DEFAULT_TAB], activeKey: DEFAULT_TAB.key }),
    }),
    {
      name: 'hanjian-admin-tabs',
      partialize: (state) => ({ tabs: state.tabs, activeKey: state.activeKey }),
    },
  ),
)
