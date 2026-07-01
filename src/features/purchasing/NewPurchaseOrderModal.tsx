import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useLocaleStore } from '@/stores/localeStore'
import { useActiveSuppliers, useCreatePurchaseOrder, usePurchasableRefs } from './hooks'
import type { POCartLine, POKind, PurchasableRef } from './types'

interface Entry {
  quantity: string
  unitPrice: string
}

export function NewPurchaseOrderModal({
  kinds,
  onClose,
}: {
  kinds: POKind[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const [kind, setKind] = useState<POKind>(kinds[0])
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<Record<string, Entry>>({})

  const suppliers = useActiveSuppliers()
  const refs = usePurchasableRefs(kind)
  const create = useCreatePurchaseOrder()

  function changeKind(next: POKind) {
    setKind(next)
    setCart({})
  }

  function setEntry(id: string, patch: Partial<Entry>) {
    setCart((prev) => {
      const current = prev[id] ?? { quantity: '', unitPrice: '' }
      return { ...prev, [id]: { ...current, ...patch } }
    })
  }

  const lines: POCartLine[] = Object.entries(cart)
    .map(([ref_id, e]) => ({
      ref_id,
      quantity: Number(e.quantity),
      unit_price: e.unitPrice === '' ? null : Number(e.unitPrice),
    }))
    .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0)

  const name = (r: PurchasableRef) => (language === 'ar' && r.name_ar ? r.name_ar : r.name)

  async function submit() {
    if (!supplierId || lines.length === 0) return
    await create.mutateAsync({ kind, supplierId, items: lines, notes: notes || undefined })
    onClose()
  }

  return (
    <Modal title={t('purchasing.new.title')} onClose={onClose}>
      <div className="space-y-4">
        {kinds.length > 1 && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{t('purchasing.new.kind')}</span>
            <select
              value={kind}
              onChange={(e) => changeKind(e.target.value as POKind)}
              className="w-full rounded-md border border-border px-3 py-2"
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {t(`purchasing.kind.${k}`)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">{t('purchasing.new.supplier')}</span>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2"
          >
            <option value="">{t('purchasing.new.selectSupplier')}</option>
            {(suppliers.data ?? []).map(
              (s: { id: string; name: string; name_ar: string | null }) => (
                <option key={s.id} value={s.id}>
                  {language === 'ar' && s.name_ar ? s.name_ar : s.name}
                </option>
              ),
            )}
          </select>
        </label>

        {refs.isLoading ? (
          <Spinner />
        ) : refs.error ? (
          <p className="text-danger">{(refs.error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-3 py-1.5 text-start font-medium">
                    {t('purchasing.detail.item')}
                  </th>
                  <th className="px-3 py-1.5 text-end font-medium">
                    {t('purchasing.detail.quantity')}
                  </th>
                  <th className="px-3 py-1.5 text-end font-medium">
                    {t('purchasing.detail.unitPrice')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(refs.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5">
                      {name(r)}
                      <span className="text-muted"> ({r.unit})</span>
                    </td>
                    <td className="px-3 py-1.5 text-end">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        inputMode="decimal"
                        aria-label={`${name(r)} ${t('purchasing.detail.quantity')}`}
                        value={cart[r.id]?.quantity ?? ''}
                        onChange={(e) => setEntry(r.id, { quantity: e.target.value })}
                        className="w-24 rounded-md border border-border px-2 py-1 text-end"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-end">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`${name(r)} ${t('purchasing.detail.unitPrice')}`}
                        placeholder={String(r.unit_price)}
                        value={cart[r.id]?.unitPrice ?? ''}
                        onChange={(e) => setEntry(r.id, { unitPrice: e.target.value })}
                        className="w-24 rounded-md border border-border px-2 py-1 text-end"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">{t('purchasing.new.notes')}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border px-3 py-2"
          />
        </label>

        {create.error && <p className="text-sm text-danger">{(create.error as Error).message}</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted">{t('purchasing.new.lineCount', { n: lines.length })}</p>
          <div className="flex gap-2">
            <Button type="button" className="bg-muted" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!supplierId || lines.length === 0 || create.isPending}
              onClick={() => void submit()}
            >
              {t('purchasing.new.submit')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
