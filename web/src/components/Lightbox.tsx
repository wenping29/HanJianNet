import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!url) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [url, onClose])

  if (!url) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6" onClick={onClose}>
      <img src={url} alt="" className="max-h-full max-w-full rounded-sm shadow-card" onClick={(e) => e.stopPropagation()} />
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-sm border border-paperedge/40 text-paperdim hover:border-cinnabar hover:text-cinnabarlight"
      >
        ✕
      </button>
    </div>
  )
}
