import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="ink-hero flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="font-garamond text-7xl font-semibold text-paperedge/20">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-[0.3em] text-paper">{t('notFound.title')}</h1>
      <p className="mt-3 text-sm text-paperdim">{t('notFound.message')}</p>
      <Link to="/" className="btn-primary mt-8">
        {t('common.returnHome')}
      </Link>
    </div>
  )
}
