import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

/** A titled report panel with a CSV export action and consistent loading/error/empty states. */
export function ReportCard({
  title,
  isLoading,
  error,
  isEmpty,
  onExport,
  children,
}: {
  title: string
  isLoading: boolean
  error: unknown
  isEmpty: boolean
  onExport: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onExport}
          disabled={isLoading || isEmpty || !!error}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm text-muted hover:bg-surface disabled:opacity-40"
        >
          <Download size={14} aria-hidden /> {t('reports.export')}
        </button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <p className="text-danger">{(error as Error).message}</p>
      ) : isEmpty ? (
        <p className="text-sm text-muted">{t('reports.empty')}</p>
      ) : (
        <div className="overflow-x-auto">{children}</div>
      )}
    </Card>
  )
}
