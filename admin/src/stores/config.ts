import { create } from 'zustand'
import { api } from '../lib/api'
import { ENCRYPTION_CONFIG_KEY, setCryptoEnabled } from '../lib/crypto'

interface ConfigState {
  /** 全部配置（category 任意）键值对 */
  items: Record<string, string>
  loaded: boolean
  /** 拉取配置；后端不可用时静默降级到 fallback */
  load: () => Promise<void>
  /** 按 key 取数字型配置，解析失败或未加载时降级到 fallback */
  getNumber: (key: string, fallback: number) => number
  /** 按 key 取布尔型配置，非 "true"/"false" 或未加载时降级到 fallback */
  getBoolean: (key: string, fallback: boolean) => boolean
}

export const useConfig = create<ConfigState>((set, get) => ({
  items: {},
  loaded: false,
  load: async () => {
    try {
      const data = await api.listSystemConfigs()
      const items: Record<string, string> = {}
      for (const it of data.items ?? []) items[it.key] = it.value
      set({ items, loaded: true })
      if (items[ENCRYPTION_CONFIG_KEY] === 'false') setCryptoEnabled(false)
    } catch {
      // 后端不可用时保留空配置，调用方使用 fallback
      set({ loaded: true })
    }
  },
  getNumber: (key, fallback) => {
    const raw = get().items[key]
    if (raw == null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
  },
  getBoolean: (key, fallback) => {
    const raw = get().items[key]
    if (raw === 'true') return true
    if (raw === 'false') return false
    return fallback
  },
}))