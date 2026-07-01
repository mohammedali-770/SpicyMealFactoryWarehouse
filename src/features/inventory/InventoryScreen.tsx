import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useLocaleStore } from '@/stores/localeStore'
import { useAuth } from '@/hooks/useAuth'
import { useStockLevels } from './hooks'
import { AdjustStockModal } from './AdjustStockModal'
import { stockStatus } from './stock'
import type { StockLevel } from './types'

const TONE: Record<ReturnType<typeof stockStatus>, string> = {
  negative: 'bg-red-100 text-red-800',
  empty: 'bg-stone-200 text-stone-600',
  ok: 'bg-green-100 text-green-800',
}

export function InventoryScreen() {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const { role } = useAuth()
  const levels = useStockLevels()
  const [selected, setSelected] = useState<StockLevel | null>(null)

  const canAdjust = role === 'admin' || role === 'general_manager' || role === 'warehouse_manager'
  const rows = levels.data ?? []

  return (
    <section className="space-y-4" data-testid="inventory">
      <h1 className="font-display text-2xl font-bold text-ink">{t('inventory.title')}</h1>

      {levels.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : levels.error ? (
        <Card>
          <p className="text-danger">{(levels.error as Error).message}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted">{t('inventory.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">{t('inventory.fields.sku')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('inventory.fields.item')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('inventory.fields.unit')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('inventory.fields.onHand')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.item_id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                >
                  <td className="px-4 py-2 text-muted">{r.sku ?? '—'}</td>
                  <td className="px-4 py-2 font-medium">
                    {language === 'ar' && r.name_ar ? r.name_ar : r.name}
                  </td>
                  <td className="px-4 py-2 text-muted">{r.unit}</td>
                  <td className="px-4 py-2 text-end">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[stockStatus(r.on_hand)]}`}
                    >
                      {r.on_hand}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selected && (
        <AdjustStockModal item={selected} canAdjust={canAdjust} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
