import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-garamond text-6xl font-semibold text-paperedge/20">404</p>
      <h1 className="mt-4 text-xl font-bold tracking-[0.3em] text-paper">{t('notFound.title')}</h1>
      <Link to="/reviews" className="btn-ghost mt-8">
        {t('notFound.returnToReviews')}
      </Link>
    </div>
  )
}
