import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRiyadh } from '@/lib/datetime'
import { useAuth } from '@/hooks/useAuth'
import { BatchStatusBadge } from './StatusBadge'
import { BatchDetailModal } from './BatchDetailModal'
import { NewBatchModal } from './NewBatchModal'
import { useProductionBatches } from './hooks'
import { BATCH_STATUSES, managesProduction } from './status'
import type { BatchStatus, ProductionBatchRow } from './types'

export function ProductionScreen() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const [status, setStatus] = useState<BatchStatus | 'all'>('all')
  const batches = useProductionBatches({ status })
  const [selected, setSelected] = useState<ProductionBatchRow | null>(null)
  const [creating, setCreating] = useState(false)

  const canManage = managesProduction(role)
  const rows = batches.data ?? []

  return (
    <section className="space-y-4" data-testid="production">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{t('production.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BatchStatus | 'all')}
            className="rounded-md border border-border px-2 py-1 text-sm"
          >
            <option value="all">{t('production.filter.all')}</option>
            {BATCH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`production.status.${s}`)}
              </option>
            ))}
          </select>
          {canManage && (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus size={16} className="me-1" aria-hidden /> {t('production.new.title')}
            </Button>
          )}
        </div>
      </div>

      {batches.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : batches.error ? (
        <Card>
          <p className="text-danger">{(batches.error as Error).message}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted">{t('production.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">
                  {t('production.fields.number')}
                </th>
                <th className="px-4 py-2 text-start font-medium">{t('production.fields.date')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('production.fields.inputs')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('production.fields.outputs')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-2 font-medium">{b.batch_number ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">
                    {formatRiyadh(b.order_date, 'yyyy-MM-dd')}
                  </td>
                  <td className="px-4 py-2 text-end">{b.batch_inputs?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-2 text-end">{b.batch_outputs?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">
                    <BatchStatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selected && <BatchDetailModal batch={selected} onClose={() => setSelected(null)} />}
      {creating && <NewBatchModal onClose={() => setCreating(false)} />}
    </section>
  )
}
