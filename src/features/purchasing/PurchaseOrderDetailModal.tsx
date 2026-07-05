import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatSAR } from '@/lib/currency'
import { formatRiyadh } from '@/lib/datetime'
import { useLocaleStore } from '@/stores/localeStore'
import { useAuth } from '@/hooks/useAuth'
import { PurchaseStatusBadge } from './StatusBadge'
import { allowedPurchaseTransitions } from './status'
import { usePurchaseOrderLines, useSetPurchaseOrderStatus } from './hooks'
import type { POStatus, PurchaseOrderRow } from './types'

export function PurchaseOrderDetailModal({
  po,
  onClose,
}: {
  po: PurchaseOrderRow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const { role } = useAuth()
  const lines = usePurchaseOrderLines(po.id)
  const setStatus = useSetPurchaseOrderStatus()

  const targets = allowedPurchaseTransitions(po.status, { role, kind: po.kind })

  async function act(status: POStatus) {
    await setStatus.mutateAsync({ poId: po.id, status })
    onClose()
  }

  return (
    <Modal title={po.po_number ?? t('purchasing.detail.title')} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <PurchaseStatusBadge status={po.status} />
          <span className="text-muted">{t(`purchasing.kind.${po.kind}`)}</span>
          <span className="text-muted">{formatRiyadh(po.order_date)}</span>
          {po.suppliers && (
            <span className="text-muted">
              {language === 'ar' && po.suppliers.name_ar ? po.suppliers.name_ar : po.suppliers.name}
            </span>
          )}
        </div>

        {lines.isLoading ? (
          <Spinner />
        ) : lines.error ? (
          <p className="text-danger">{(lines.error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="py-1 text-start font-medium">{t('purchasing.detail.item')}</th>
                  <th className="py-1 text-end font-medium">{t('purchasing.detail.quantity')}</th>
                  <th className="py-1 text-end font-medium">{t('purchasing.detail.unitPrice')}</th>
                  <th className="py-1 text-end font-medium">{t('purchasing.detail.lineTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {(lines.data ?? []).map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="py-1">
                      {l.line_name}
                      {l.line_serial ? (
                        <span className="text-muted"> · {l.line_serial}</span>
                      ) : null}
                    </td>
                    <td className="py-1 text-end">{l.quantity}</td>
                    <td className="py-1 text-end">{formatSAR(Number(l.unit_price), language)}</td>
                    <td className="py-1 text-end">
                      {l.line_total == null ? '—' : formatSAR(Number(l.line_total), language)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium">
                  <td className="py-1" colSpan={3}>
                    {t('purchasing.detail.total')}
                  </td>
                  <td className="py-1 text-end">{formatSAR(Number(po.total_amount), language)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {po.notes && (
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{t('purchasing.detail.notes')}:</span> {po.notes}
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
                  {t(`purchasing.actions.${status}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
