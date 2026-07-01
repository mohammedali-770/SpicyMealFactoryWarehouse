import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatSAR } from '@/lib/currency'
import { formatRiyadh } from '@/lib/datetime'
import { useLocaleStore } from '@/stores/localeStore'
import { StatusBadge } from './StatusBadge'
import { OrderDetailModal } from './OrderDetailModal'
import { useOrders } from './hooks'
import { ORDER_STATUSES } from './status'
import type { OrderCategory, OrderRow, OrderStatus } from './types'

export function OrdersView({
  title,
  category,
  action,
}: {
  title: string
  category?: OrderCategory
  action?: ReactNode
}) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const orders = useOrders({ category, status })
  const [selected, setSelected] = useState<OrderRow | null>(null)

  const rows = orders.data ?? []

  return (
    <section className="space-y-4" data-testid={`orders-${category ?? 'all'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-muted">
            {t('orders.filter.status')}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}
              className="rounded-md border border-border px-2 py-1 text-sm"
            >
              <option value="all">{t('orders.filter.all')}</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`orders.status.${s}`)}
                </option>
              ))}
            </select>
          </label>
          {action}
        </div>
      </div>

      {orders.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : orders.error ? (
        <Card>
          <p className="text-danger">{(orders.error as Error).message}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted">{t('orders.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">{t('orders.fields.number')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('orders.fields.date')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('orders.fields.branch')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('orders.fields.items')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('common.status')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('orders.fields.total')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-2 font-medium">{o.order_number ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">
                    {formatRiyadh(o.order_date, 'yyyy-MM-dd')}
                  </td>
                  <td className="px-4 py-2">
                    {o.branches
                      ? language === 'ar' && o.branches.name_ar
                        ? o.branches.name_ar
                        : o.branches.name
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-end">{o.order_items?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-2 text-end">
                    {formatSAR(Number(o.total_amount), language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
