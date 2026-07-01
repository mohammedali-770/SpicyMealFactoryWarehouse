import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatRiyadh } from '@/lib/datetime'
import { useLocaleStore } from '@/stores/localeStore'
import { useAdjustStock, useItemMovements } from './hooks'
import { formatSigned } from './stock'
import type { StockLevel } from './types'

export function AdjustStockModal({
  item,
  canAdjust,
  onClose,
}: {
  item: StockLevel
  canAdjust: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const movements = useItemMovements(item.item_id)
  const adjust = useAdjustStock()
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const name = language === 'ar' && item.name_ar ? item.name_ar : item.name

  async function submit() {
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty === 0) return
    await adjust.mutateAsync({
      itemId: item.item_id,
      quantity: qty,
      note: note.trim() || undefined,
    })
    setQuantity('')
    setNote('')
  }

  return (
    <Modal title={name} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted">
          {t('inventory.adjust.current')}:{' '}
          <span className="font-medium text-ink">
            {item.on_hand} {item.unit}
          </span>
        </p>

        {canAdjust && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium text-ink">{t('inventory.adjust.title')}</p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t('inventory.adjust.quantity')}</span>
                <input
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="+/-"
                  className="w-28 rounded-md border border-border px-2 py-1 text-end"
                />
              </label>
              <label className="flex-1 text-sm">
                <span className="mb-1 block text-muted">{t('inventory.adjust.note')}</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-md border border-border px-2 py-1"
                />
              </label>
              <Button
                type="button"
                disabled={quantity === '' || Number(quantity) === 0 || adjust.isPending}
                onClick={() => void submit()}
              >
                {t('inventory.adjust.submit')}
              </Button>
            </div>
            {adjust.error && (
              <p className="text-sm text-danger">{(adjust.error as Error).message}</p>
            )}
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-medium text-ink">{t('inventory.movements.title')}</p>
          {movements.isLoading ? (
            <Spinner />
          ) : movements.error ? (
            <p className="text-danger">{(movements.error as Error).message}</p>
          ) : (movements.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t('inventory.movements.empty')}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {(movements.data ?? []).map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 border-b border-border pb-1 last:border-0"
                >
                  <span className="text-muted">
                    {formatRiyadh(m.created_at)} · {t(`inventory.reason.${m.reason}`)}
                    {m.orders?.order_number ? ` · ${m.orders.order_number}` : ''}
                    {m.note ? ` · ${m.note}` : ''}
                  </span>
                  <span
                    className={
                      m.quantity < 0 ? 'font-medium text-danger' : 'font-medium text-green-700'
                    }
                  >
                    {formatSigned(m.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
