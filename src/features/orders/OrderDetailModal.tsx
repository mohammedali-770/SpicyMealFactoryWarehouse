import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatSAR } from '@/lib/currency'
import { formatRiyadh } from '@/lib/datetime'
import { useLocaleStore } from '@/stores/localeStore'
import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from './StatusBadge'
import { allowedTransitions } from './status'
import { useOrderHistory, useOrderLines, useSetOrderStatus } from './hooks'
import type { OrderRow, OrderStatus } from './types'

export function OrderDetailModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const { profile, role } = useAuth()
  const lines = useOrderLines(order.id)
  const history = useOrderHistory(order.id)
  const setStatus = useSetOrderStatus()
  const [note, setNote] = useState('')

  const targets = allowedTransitions(order.status, {
    role,
    isOwner: profile?.id === order.customer_id,
    category: order.category,
  })

  async function act(status: OrderStatus) {
    await setStatus.mutateAsync({ orderId: order.id, status, note: note.trim() || undefined })
    onClose()
  }

  return (
    <Modal title={order.order_number ?? t('orders.detail.title')} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <StatusBadge status={order.status} />
          {order.category && (
            <span className="text-muted">{t(`admin.items.category.${order.category}`)}</span>
          )}
          <span className="text-muted">{formatRiyadh(order.order_date)}</span>
          {order.branches && (
            <span className="text-muted">
              {language === 'ar' && order.branches.name_ar
                ? order.branches.name_ar
                : order.branches.name}
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
                  <th className="py-1 text-start font-medium">{t('orders.detail.item')}</th>
                  <th className="py-1 text-end font-medium">{t('orders.detail.quantity')}</th>
                  <th className="py-1 text-end font-medium">{t('orders.detail.stockLevel')}</th>
                  <th className="py-1 text-end font-medium">{t('orders.detail.unitPrice')}</th>
                  <th className="py-1 text-end font-medium">{t('orders.detail.lineTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {(lines.data ?? []).map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="py-1">
                      {l.item_name}
                      {l.item_serial ? (
                        <span className="text-muted"> · {l.item_serial}</span>
                      ) : null}
                    </td>
                    <td className="py-1 text-end">{l.quantity}</td>
                    <td className="py-1 text-end">
                      {l.stock_level == null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        l.stock_level
                      )}
                    </td>
                    <td className="py-1 text-end">
                      {l.unit_price == null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        formatSAR(Number(l.unit_price), language)
                      )}
                    </td>
                    <td className="py-1 text-end">
                      {l.line_total == null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        formatSAR(Number(l.line_total), language)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-medium">
                  <td className="py-1" colSpan={4}>
                    {t('orders.detail.total')}
                  </td>
                  <td className="py-1 text-end">
                    {formatSAR(Number(order.total_amount), language)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {order.notes && (
          <p className="text-sm text-muted">
            <span className="font-medium text-ink">{t('orders.detail.notes')}:</span> {order.notes}
          </p>
        )}

        {history.data && history.data.length > 0 && (
          <div className="text-xs text-muted">
            <p className="mb-1 font-medium text-ink">{t('orders.detail.history')}</p>
            <ul className="space-y-0.5">
              {history.data.map((h) => (
                <li key={h.id}>
                  {formatRiyadh(h.created_at)} ·{' '}
                  {h.from_status ? t(`orders.status.${h.from_status}`) : '—'} →{' '}
                  {h.to_status ? t(`orders.status.${h.to_status}`) : '—'}
                  {h.note ? ` · ${h.note}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {targets.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('orders.detail.notePlaceholder')}
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
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
                  {t(`orders.actions.${status}`)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
