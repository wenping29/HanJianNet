import { useTranslation } from 'react-i18next'
import type { ReviewStatus } from '../types'

const STATUS_CLS: Record<ReviewStatus, string> = {
  pending: 'border-bronze/60 bg-bronze/15 text-bronzelight',
  approved: 'border-bamboo/70 bg-bamboo/20 text-bamboolight',
  rejected: 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight',
}

const STATUS_I18N: Record<ReviewStatus, string> = {
  pending: 'statusBadge.pending',
  approved: 'statusBadge.approved',
  rejected: 'statusBadge.rejected',
}

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useTranslation()
  return <span className={`badge ${STATUS_CLS[status]}`}>{t(STATUS_I18N[status])}</span>
}
