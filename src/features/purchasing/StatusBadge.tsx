import { useTranslation } from 'react-i18next'
import type { POStatus } from './types'

const STYLES: Record<POStatus, string> = {
  draft: 'bg-stone-200 text-stone-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function PurchaseStatusBadge({ status }: { status: POStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {t(`purchasing.status.${status}`)}
    </span>
  )
}
