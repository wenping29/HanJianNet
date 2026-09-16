import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { THEME_SWATCHES, THEMES, useTheme } from '../stores/theme'

export default function ThemeSwitcher() {
  const { t } = useTranslation()
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-sm tracking-wider text-paperdim/70 transition hover:text-paper"
        onClick={() => setOpen(!open)}
        title={t('theme.title')}
      >
        {/* 调色板图标 */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
          <path d="M8 1.6a6.4 6.4 0 0 0 0 12.8c.9 0 1.4-.6 1.4-1.3 0-.4-.2-.7-.4-1-.2-.2-.3-.5-.3-.8 0-.7.6-1.3 1.3-1.3h1.3c1.2 0 2.1-.9 2.1-2.1C13.4 4.4 11 1.6 8 1.6Z" />
          <circle cx="5.2" cy="6.2" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="8" cy="4.6" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="4.6" cy="9.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
        {t(`theme.${theme}`)}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-sm border border-paperedge/30 bg-inkcard py-1 shadow-lg">
          {THEMES.map((name) => (
            <button
              key={name}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-ink/60 ${
                name === theme ? 'font-bold text-bronzelight' : 'text-paperdim/70'
              }`}
              onClick={() => {
                setTheme(name)
                setOpen(false)
              }}
            >
              {/* 三色色卡 */}
              <span className="flex shrink-0 overflow-hidden rounded-sm border border-paperedge/30">
                {THEME_SWATCHES[name].map((color) => (
                  <span key={color} className="h-3 w-1.5" style={{ backgroundColor: color }} />
                ))}
              </span>
              {t(`theme.${name}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
