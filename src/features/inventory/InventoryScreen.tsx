import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useLocaleStore } from '@/stores/localeStore'
import { useAuth } from '@/hooks/useAuth'
import { useRawMaterialLevels, useStockLevels } from './hooks'
import { AdjustStockModal } from './AdjustStockModal'
import { stockStatus } from './stock'
import type { StockLevel } from './types'

type Tab = 'items' | 'raw'

const TONE: Record<ReturnType<typeof stockStatus>, string> = {
  negative: 'bg-red-100 text-red-800',
  empty: 'bg-stone-200 text-stone-600',
  ok: 'bg-green-100 text-green-800',
}

function OnHandBadge({ value }: { value: number }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[stockStatus(value)]}`}>
      {value}
    </span>
  )
}

export function InventoryScreen() {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const { role } = useAuth()
  const [tab, setTab] = useState<Tab>('items')
  const levels = useStockLevels()
  const rawLevels = useRawMaterialLevels()
  const [selected, setSelected] = useState<StockLevel | null>(null)

  const canAdjust = role === 'admin' || role === 'general_manager' || role === 'warehouse_manager'
  const items = levels.data ?? []
  const raws = rawLevels.data ?? []
  const active = tab === 'items' ? levels : rawLevels
  const localName = (name: string, nameAr: string | null) =>
    language === 'ar' && nameAr ? nameAr : name

  return (
    <section className="space-y-4" data-testid="inventory">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{t('inventory.title')}</h1>
        <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm">
          {(['items', 'raw'] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded px-3 py-1 ${tab === k ? 'bg-brand text-brand-fg' : 'text-muted hover:bg-surface'}`}
            >
              {t(`inventory.tabs.${k}`)}
            </button>
          ))}
        </div>
      </div>

      {active.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : active.error ? (
        <Card>
          <p className="text-danger">{(active.error as Error).message}</p>
        </Card>
      ) : tab === 'items' ? (
        items.length === 0 ? (
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
                {items.map((r) => (
                  <tr
                    key={r.item_id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-surface"
                  >
                    <td className="px-4 py-2 text-muted">{r.sku ?? '—'}</td>
                    <td className="px-4 py-2 font-medium">{localName(r.name, r.name_ar)}</td>
                    <td className="px-4 py-2 text-muted">{r.unit}</td>
                    <td className="px-4 py-2 text-end">
                      <OnHandBadge value={r.on_hand} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : raws.length === 0 ? (
        <Card>
          <p className="text-muted">{t('inventory.emptyRaw')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">{t('inventory.fields.item')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('inventory.fields.unit')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('inventory.fields.onHand')}</th>
              </tr>
            </thead>
            <tbody>
              {raws.map((r) => (
                <tr key={r.raw_material_id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{localName(r.name, r.name_ar)}</td>
                  <td className="px-4 py-2 text-muted">{r.unit}</td>
                  <td className="px-4 py-2 text-end">
                    <OnHandBadge value={r.on_hand} />
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
