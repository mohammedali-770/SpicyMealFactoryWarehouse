import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRiyadh } from '@/lib/datetime'
import { useAuth } from '@/hooks/useAuth'
import { BatchStatusBadge } from './StatusBadge'
import { allowedBatchTransitions, managesProduction } from './status'
import { useBatchInputs, useBatchOutputs, useSetBatchStatus } from './hooks'
import type { BatchStatus, ProductionBatchRow } from './types'

function LineList({
  title,
  rows,
  loading,
}: {
  title: string
  rows: { id: string; line_name: string | null; quantity: number }[]
  loading: boolean
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink">{title}</p>
      {loading ? (
        <Spinner />
      ) : (
        <ul className="space-y-0.5 text-sm">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex justify-between border-b border-border pb-0.5 last:border-0"
            >
              <span>{r.line_name}</span>
              <span className="text-muted">{r.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BatchDetailModal({
  batch,
  onClose,
}: {
  batch: ProductionBatchRow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const inputs = useBatchInputs(batch.id)
  const outputs = useBatchOutputs(batch.id)
  const setStatus = useSetBatchStatus()

  const targets = allowedBatchTransitions(batch.status, managesProduction(role))

  async function act(status: BatchStatus) {
    await setStatus.mutateAsync({ batchId: batch.id, status })
    onClose()
  }

  return (
    <Modal title={batch.batch_number ?? t('production.detail.title')} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <BatchStatusBadge status={batch.status} />
          <span className="text-muted">{formatRiyadh(batch.order_date)}</span>
        </div>

        <LineList
          title={t('production.detail.inputs')}
          rows={inputs.data ?? []}
          loading={inputs.isLoading}
        />
        <LineList
          title={t('production.detail.outputs')}
          rows={outputs.data ?? []}
          loading={outputs.isLoading}
        />

        {batch.notes && (
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{t('production.detail.notes')}:</span>{' '}
            {batch.notes}
          </p>
        )}

        {targets.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {setStatus.error && (
              <p className="text-sm text-danger">{(setStatus.error as Error).message}</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {targets.map((status) => (
                <Button
                  key={status}
                  type="button"
                  disabled={setStatus.isPending}
                  className={status === 'cancelled' ? 'bg-danger' : ''}
                  onClick={() => void act(status)}
                >
                  {t(`production.actions.${status}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
