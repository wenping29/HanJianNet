import { create } from 'zustand'
import { api } from '../lib/api'

interface ConfigState {
  /** 公开配置（category=web）键值对 */
  items: Record<string, string>
  loaded: boolean
  /** 拉取配置；后端不可用时静默降级到 fallback */
  load: () => Promise<void>
  /** 按 key 取数字型配置，解析失败或未加载时降级到 fallback */
  getPageSize: (key: string, fallback: number) => number
}

export const useConfig = create<ConfigState>((set, get) => ({
  items: {},
  loaded: false,
  load: async () => {
    try {
      const data = await api.getPublicConfig()
      set({ items: data.items ?? {}, loaded: true })
    } catch {
      // 后端不可用时保留空配置，调用方使用 fallback
      set({ loaded: true })
    }
  },
  getPageSize: (key, fallback) => {
    const raw = get().items[key]
    if (raw == null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
  },
}))
