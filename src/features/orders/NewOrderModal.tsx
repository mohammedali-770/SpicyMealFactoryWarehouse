import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useLocaleStore } from '@/stores/localeStore'
import { useCreateOrder, useOrderableBranches, useOrderableItems } from './hooks'
import type { CartLine, OrderCategory } from './types'

interface ItemOption {
  id: string
  name: string
  name_ar: string | null
  sku: string | null
  category: OrderCategory
  unit: string
  stock_level_required: boolean
}

interface CartEntry {
  quantity: string
  stockLevel: string
}

export function NewOrderModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const items = useOrderableItems()
  const branches = useOrderableBranches()
  const create = useCreateOrder()

  const [cart, setCart] = useState<Record<string, CartEntry>>({})
  const [branchId, setBranchId] = useState('')
  const [notes, setNotes] = useState('')

  const grouped = useMemo(() => {
    const opts = (items.data ?? []) as ItemOption[]
    const map: Record<OrderCategory, ItemOption[]> = { warehouse: [], factory: [] }
    for (const it of opts) map[it.category]?.push(it)
    return map
  }, [items.data])

  function setEntry(id: string, patch: Partial<CartEntry>) {
    setCart((prev) => {
      const current = prev[id] ?? { quantity: '', stockLevel: '' }
      return { ...prev, [id]: { ...current, ...patch } }
    })
  }

  const lines: CartLine[] = Object.entries(cart)
    .map(([item_id, e]) => ({
      item_id,
      quantity: Number(e.quantity),
      stock_level: e.stockLevel === '' ? null : Number(e.stockLevel),
    }))
    .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0)

  const name = (it: ItemOption) => (language === 'ar' && it.name_ar ? it.name_ar : it.name)

  async function submit() {
    if (lines.length === 0) return
    await create.mutateAsync({
      items: lines,
      branchId: branchId || null,
      notes: notes || undefined,
    })
    onClose()
  }

  return (
    <Modal title={t('orders.new.title')} onClose={onClose}>
      {items.isLoading ? (
        <Spinner />
      ) : items.error ? (
        <p className="text-danger">{(items.error as Error).message}</p>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{t('orders.new.branch')}</span>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2"
            >
              <option value="">{t('orders.new.noBranch')}</option>
              {(branches.data ?? []).map(
                (b: { id: string; name: string; name_ar: string | null }) => (
                  <option key={b.id} value={b.id}>
                    {language === 'ar' && b.name_ar ? b.name_ar : b.name}
                  </option>
                ),
              )}
            </select>
          </label>

          {(['warehouse', 'factory'] as OrderCategory[]).map((cat) =>
            grouped[cat].length === 0 ? null : (
              <div key={cat}>
                <h3 className="mb-1 font-medium text-ink">{t(`admin.items.category.${cat}`)}</h3>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-start text-sm">
                    <thead className="border-b border-border bg-surface">
                      <tr>
                        <th className="px-3 py-1.5 text-start font-medium">
                          {t('orders.detail.item')}
                        </th>
                        <th className="px-3 py-1.5 text-end font-medium">
                          {t('orders.detail.quantity')}
                        </th>
                        <th className="px-3 py-1.5 text-end font-medium">
                          {t('orders.detail.stockLevel')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[cat].map((it) => (
                        <tr key={it.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5">
                            {name(it)}
                            <span className="text-muted"> ({it.unit})</span>
                          </td>
                          <td className="px-3 py-1.5 text-end">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              inputMode="decimal"
                              aria-label={`${name(it)} ${t('orders.detail.quantity')}`}
                              value={cart[it.id]?.quantity ?? ''}
                              onChange={(e) => setEntry(it.id, { quantity: e.target.value })}
                              className="w-24 rounded-md border border-border px-2 py-1 text-end"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-end">
                            {it.stock_level_required ? (
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                inputMode="decimal"
                                aria-label={`${name(it)} ${t('orders.detail.stockLevel')}`}
                                value={cart[it.id]?.stockLevel ?? ''}
                                onChange={(e) => setEntry(it.id, { stockLevel: e.target.value })}
                                className="w-24 rounded-md border border-border px-2 py-1 text-end"
                              />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{t('orders.new.notes')}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2"
            />
          </label>

          {create.error && <p className="text-sm text-danger">{(create.error as Error).message}</p>}

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted">{t('orders.new.lineCount', { n: lines.length })}</p>
            <div className="flex gap-2">
              <Button type="button" className="bg-muted" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                disabled={lines.length === 0 || create.isPending}
                onClick={() => void submit()}
              >
                {t('orders.new.submit')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
