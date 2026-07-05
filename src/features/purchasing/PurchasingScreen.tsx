import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatSAR } from '@/lib/currency'
import { formatRiyadh } from '@/lib/datetime'
import { useLocaleStore } from '@/stores/localeStore'
import { useAuth } from '@/hooks/useAuth'
import { PurchaseStatusBadge } from './StatusBadge'
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal'
import { NewPurchaseOrderModal } from './NewPurchaseOrderModal'
import { usePurchaseOrders } from './hooks'
import { PO_STATUSES, creatableKinds } from './status'
import type { POKind, POStatus, PurchaseOrderRow } from './types'

export function PurchasingScreen() {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const { role } = useAuth()
  const [status, setStatus] = useState<POStatus | 'all'>('all')
  const [kind, setKind] = useState<POKind | 'all'>('all')
  const orders = usePurchaseOrders({
    status,
    kind: kind === 'all' ? undefined : kind,
  })
  const [selected, setSelected] = useState<PurchaseOrderRow | null>(null)
  const [creating, setCreating] = useState(false)

  const kinds = creatableKinds(role)
  const rows = orders.data ?? []

  return (
    <section className="space-y-4" data-testid="purchasing">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{t('purchasing.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as POKind | 'all')}
            className="rounded-md border border-border px-2 py-1 text-sm"
          >
            <option value="all">{t('purchasing.filter.allKinds')}</option>
            <option value="warehouse">{t('purchasing.kind.warehouse')}</option>
            <option value="raw_material">{t('purchasing.kind.raw_material')}</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as POStatus | 'all')}
            className="rounded-md border border-border px-2 py-1 text-sm"
          >
            <option value="all">{t('purchasing.filter.all')}</option>
            {PO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`purchasing.status.${s}`)}
              </option>
            ))}
          </select>
          {kinds.length > 0 && (
            <Button type="button" onClick={() => setCreating(true)}>
              <Plus size={16} className="me-1" aria-hidden /> {t('purchasing.new.title')}
            </Button>
          )}
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
          <p className="text-muted">{t('purchasing.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">
                  {t('purchasing.fields.number')}
                </th>
                <th className="px-4 py-2 text-start font-medium">{t('purchasing.fields.kind')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('purchasing.fields.date')}</th>
                <th className="px-4 py-2 text-start font-medium">
                  {t('purchasing.fields.supplier')}
                </th>
                <th className="px-4 py-2 text-end font-medium">{t('purchasing.fields.items')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('common.status')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('purchasing.fields.total')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-2 font-medium">{o.po_number ?? '—'}</td>
                  <td className="px-4 py-2 text-muted">{t(`purchasing.kind.${o.kind}`)}</td>
                  <td className="px-4 py-2 text-muted">
                    {formatRiyadh(o.order_date, 'yyyy-MM-dd')}
                  </td>
                  <td className="px-4 py-2">
                    {o.suppliers
                      ? language === 'ar' && o.suppliers.name_ar
                        ? o.suppliers.name_ar
                        : o.suppliers.name
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-end">{o.purchase_order_items?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-2">
                    <PurchaseStatusBadge status={o.status} />
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

      {selected && <PurchaseOrderDetailModal po={selected} onClose={() => setSelected(null)} />}
      {creating && <NewPurchaseOrderModal kinds={kinds} onClose={() => setCreating(false)} />}
    </section>
  )
}
