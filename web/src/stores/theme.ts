import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName = 'ink' | 'paper' | 'cinnabar' | 'bamboo'

/** 可切换的主题，顺序即切换器中的展示顺序 */
export const THEMES: ThemeName[] = ['ink', 'paper', 'cinnabar', 'bamboo']

export const DEFAULT_THEME: ThemeName = 'ink'

/** 每套主题的调色板，仅用于切换器中的色卡预览 */
export const THEME_SWATCHES: Record<ThemeName, [string, string, string]> = {
  ink: ['#0E0B08', '#F2EAD8', '#9B2B2B'],
  paper: ['#F4EDDD', '#201A14', '#9B2B2B'],
  cinnabar: ['#140808', '#F5E4DC', '#C1352B'],
  bamboo: ['#07100C', '#E4F0E6', '#2F7D5B'],
}

export function isThemeName(v: unknown): v is ThemeName {
  return typeof v === 'string' && (THEMES as string[]).includes(v)
}

/** 主题直接写入 <html data-theme>，CSS 变量随即生效 */
function applyTheme(theme: ThemeName) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

interface ThemeState {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      // 同步更新 DOM，避免子组件在同一轮渲染中读到旧主题的 CSS 变量
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    {
      name: 'hanjian-theme',
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? DEFAULT_THEME)
      },
    },
  ),
)
