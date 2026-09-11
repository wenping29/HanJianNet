import { useTranslation } from 'react-i18next'
import type { ReviewStatus } from '../types'

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation()
  const META: Record<ReviewStatus, { label: string; cls: string }> = {
    pending: { label: t('reviews.pending'), cls: 'border-bronze/60 bg-bronze/15 text-bronzelight' },
    approved: { label: t('reviews.approved'), cls: 'border-bamboo/70 bg-bamboo/20 text-bamboolight' },
    rejected: { label: t('reviews.rejected'), cls: 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight' },
  }
  const meta = META[status]
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>
}
