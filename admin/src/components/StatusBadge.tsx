import type { ReviewStatus } from '../types'

const META: Record<ReviewStatus, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'border-bronze/60 bg-bronze/15 text-bronzelight' },
  approved: { label: '已通过', cls: 'border-bamboo/70 bg-bamboo/20 text-bamboolight' },
  rejected: { label: '已驳回', cls: 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight' },
}

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  const meta = META[status]
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>
}
