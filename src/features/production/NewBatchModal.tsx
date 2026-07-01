import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useLocaleStore } from '@/stores/localeStore'
import { useCreateBatch, useRawMaterialRefs, useWarehouseItemRefs } from './hooks'
import type { BatchLine, BatchRef } from './types'

function RefTable({
  title,
  query,
  cart,
  onChange,
}: {
  title: string
  query: UseQueryResult<BatchRef[]>
  cart: Record<string, string>
  onChange: (id: string, value: string) => void
}) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const name = (r: BatchRef) => (language === 'ar' && r.name_ar ? r.name_ar : r.name)

  return (
    <div>
      <h3 className="mb-1 font-medium text-ink">{title}</h3>
      {query.isLoading ? (
        <Spinner />
      ) : query.error ? (
        <p className="text-danger">{(query.error as Error).message}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-3 py-1.5 text-start font-medium">
                  {t('production.detail.item')}
                </th>
                <th className="px-3 py-1.5 text-end font-medium">
                  {t('production.detail.quantity')}
                </th>
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((r) => (
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
                      aria-label={`${name(r)} ${t('production.detail.quantity')}`}
                      value={cart[r.id] ?? ''}
                      onChange={(e) => onChange(r.id, e.target.value)}
                      className="w-24 rounded-md border border-border px-2 py-1 text-end"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function toLines(cart: Record<string, string>): BatchLine[] {
  return Object.entries(cart)
    .map(([ref_id, q]) => ({ ref_id, quantity: Number(q) }))
    .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0)
}

export function NewBatchModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const rawRefs = useRawMaterialRefs()
  const itemRefs = useWarehouseItemRefs()
  const create = useCreateBatch()

  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [outputs, setOutputs] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')

  const inputLines = toLines(inputs)
  const outputLines = toLines(outputs)
  const ready = inputLines.length > 0 && outputLines.length > 0

  async function submit() {
    if (!ready) return
    await create.mutateAsync({
      inputs: inputLines,
      outputs: outputLines,
      notes: notes || undefined,
    })
    onClose()
  }

  return (
    <Modal title={t('production.new.title')} onClose={onClose}>
      <div className="space-y-4">
        <RefTable
          title={t('production.new.inputs')}
          query={rawRefs}
          cart={inputs}
          onChange={(id, value) => setInputs((p) => ({ ...p, [id]: value }))}
        />
        <RefTable
          title={t('production.new.outputs')}
          query={itemRefs}
          cart={outputs}
          onChange={(id, value) => setOutputs((p) => ({ ...p, [id]: value }))}
        />

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">{t('production.new.notes')}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border px-3 py-2"
          />
        </label>

        {create.error && <p className="text-sm text-danger">{(create.error as Error).message}</p>}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {t('production.new.summary', {
              inputs: inputLines.length,
              outputs: outputLines.length,
            })}
          </p>
          <div className="flex gap-2">
            <Button type="button" className="bg-muted" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!ready || create.isPending}
              onClick={() => void submit()}
            >
              {t('production.new.submit')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
