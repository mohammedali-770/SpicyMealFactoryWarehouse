import { useTranslation } from 'react-i18next'
import type { BatchStatus } from './types'

const STYLES: Record<BatchStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {t(`production.status.${status}`)}
    </span>
  )
}
