import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { formatSAR } from '@/lib/currency'
import { useLocaleStore } from '@/stores/localeStore'
import { ReportCard } from './ReportCard'
import { downloadCsv, lastNDays, toCsv } from './csv'
import {
  useItemValuation,
  useProductionDaily,
  usePurchaseDaily,
  useRawMaterialValuation,
  useSalesDaily,
} from './hooks'
import type { DateRange } from './types'

const sum = <T,>(rows: T[], pick: (r: T) => number) => rows.reduce((a, r) => a + Number(pick(r)), 0)

export function ReportsScreen() {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const [range, setRange] = useState<DateRange>(() => lastNDays(new Date(), 30))

  const sales = useSalesDaily(range)
  const purchases = usePurchaseDaily(range)
  const production = useProductionDaily(range)
  const items = useItemValuation()
  const raws = useRawMaterialValuation()

  const money = (v: number) => formatSAR(Number(v), language)
  const localName = (name: string, nameAr: string | null) =>
    language === 'ar' && nameAr ? nameAr : name

  const salesRows = sales.data ?? []
  const purchaseRows = purchases.data ?? []
  const productionRows = production.data ?? []
  const itemRows = items.data ?? []
  const rawRows = raws.data ?? []

  const totals = {
    revenue: sum(salesRows, (r) => r.revenue),
    spend: sum(purchaseRows, (r) => r.spend),
    output: sum(productionRows, (r) => r.output_qty),
    itemValue: sum(itemRows, (r) => r.value),
    rawValue: sum(rawRows, (r) => r.value),
  }

  return (
    <section className="space-y-4" data-testid="reports">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{t('reports.title')}</h1>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1 text-muted">
            {t('reports.from')}
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="rounded-md border border-border px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1 text-muted">
            {t('reports.to')}
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="rounded-md border border-border px-2 py-1"
            />
          </label>
        </div>
      </div>

      {/* Sales */}
      <ReportCard
        title={t('reports.sales.title')}
        isLoading={sales.isLoading}
        error={sales.error}
        isEmpty={salesRows.length === 0}
        onExport={() =>
          downloadCsv(
            `sales_${range.from}_${range.to}.csv`,
            toCsv(
              [
                t('reports.fields.day'),
                t('reports.fields.category'),
                t('reports.fields.orders'),
                t('reports.fields.revenue'),
              ],
              salesRows.map((r) => [r.business_day, r.category ?? '', r.order_count, r.revenue]),
            ),
          )
        }
      >
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="py-1 text-start font-medium">{t('reports.fields.day')}</th>
              <th className="py-1 text-start font-medium">{t('reports.fields.category')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.orders')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.revenue')}</th>
            </tr>
          </thead>
          <tbody>
            {salesRows.map((r, i) => (
              <tr
                key={`${r.business_day}-${r.category}-${i}`}
                className="border-b border-border last:border-0"
              >
                <td className="py-1 text-muted">{r.business_day}</td>
                <td className="py-1">
                  {r.category ? t(`admin.items.category.${r.category}`) : '—'}
                </td>
                <td className="py-1 text-end">{r.order_count}</td>
                <td className="py-1 text-end">{money(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td className="py-1" colSpan={3}>
                {t('reports.total')}
              </td>
              <td className="py-1 text-end">{money(totals.revenue)}</td>
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      {/* Purchases */}
      <ReportCard
        title={t('reports.purchases.title')}
        isLoading={purchases.isLoading}
        error={purchases.error}
        isEmpty={purchaseRows.length === 0}
        onExport={() =>
          downloadCsv(
            `purchases_${range.from}_${range.to}.csv`,
            toCsv(
              [
                t('reports.fields.day'),
                t('reports.fields.kind'),
                t('reports.fields.pos'),
                t('reports.fields.spend'),
              ],
              purchaseRows.map((r) => [r.business_day, r.kind, r.po_count, r.spend]),
            ),
          )
        }
      >
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="py-1 text-start font-medium">{t('reports.fields.day')}</th>
              <th className="py-1 text-start font-medium">{t('reports.fields.kind')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.pos')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.spend')}</th>
            </tr>
          </thead>
          <tbody>
            {purchaseRows.map((r, i) => (
              <tr
                key={`${r.business_day}-${r.kind}-${i}`}
                className="border-b border-border last:border-0"
              >
                <td className="py-1 text-muted">{r.business_day}</td>
                <td className="py-1">{t(`purchasing.kind.${r.kind}`)}</td>
                <td className="py-1 text-end">{r.po_count}</td>
                <td className="py-1 text-end">{money(r.spend)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td className="py-1" colSpan={3}>
                {t('reports.total')}
              </td>
              <td className="py-1 text-end">{money(totals.spend)}</td>
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      {/* Production */}
      <ReportCard
        title={t('reports.production.title')}
        isLoading={production.isLoading}
        error={production.error}
        isEmpty={productionRows.length === 0}
        onExport={() =>
          downloadCsv(
            `production_${range.from}_${range.to}.csv`,
            toCsv(
              [t('reports.fields.day'), t('reports.fields.batches'), t('reports.fields.output')],
              productionRows.map((r) => [r.business_day, r.batch_count, r.output_qty]),
            ),
          )
        }
      >
        <table className="w-full text-start text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="py-1 text-start font-medium">{t('reports.fields.day')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.batches')}</th>
              <th className="py-1 text-end font-medium">{t('reports.fields.output')}</th>
            </tr>
          </thead>
          <tbody>
            {productionRows.map((r) => (
              <tr key={r.business_day} className="border-b border-border last:border-0">
                <td className="py-1 text-muted">{r.business_day}</td>
                <td className="py-1 text-end">{r.batch_count}</td>
                <td className="py-1 text-end">{r.output_qty}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-medium">
              <td className="py-1">{t('reports.total')}</td>
              <td className="py-1 text-end" />
              <td className="py-1 text-end">{totals.output}</td>
            </tr>
          </tfoot>
        </table>
      </ReportCard>

      {/* Valuation (item + raw material) */}
      <div className="grid gap-4 md:grid-cols-2">
        <ReportCard
          title={t('reports.itemValuation.title')}
          isLoading={items.isLoading}
          error={items.error}
          isEmpty={itemRows.length === 0}
          onExport={() =>
            downloadCsv(
              'item_valuation.csv',
              toCsv(
                [
                  t('reports.fields.item'),
                  t('reports.fields.onHand'),
                  t('reports.fields.unitPrice'),
                  t('reports.fields.value'),
                ],
                itemRows.map((r) => [r.name, r.on_hand, r.unit_price, r.value]),
              ),
            )
          }
        >
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="py-1 text-start font-medium">{t('reports.fields.item')}</th>
                <th className="py-1 text-end font-medium">{t('reports.fields.onHand')}</th>
                <th className="py-1 text-end font-medium">{t('reports.fields.value')}</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map((r) => (
                <tr key={r.item_id} className="border-b border-border last:border-0">
                  <td className="py-1">{localName(r.name, r.name_ar)}</td>
                  <td className="py-1 text-end">{r.on_hand}</td>
                  <td className="py-1 text-end">{money(r.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td className="py-1" colSpan={2}>
                  {t('reports.total')}
                </td>
                <td className="py-1 text-end">{money(totals.itemValue)}</td>
              </tr>
            </tfoot>
          </table>
        </ReportCard>

        <ReportCard
          title={t('reports.rawValuation.title')}
          isLoading={raws.isLoading}
          error={raws.error}
          isEmpty={rawRows.length === 0}
          onExport={() =>
            downloadCsv(
              'raw_material_valuation.csv',
              toCsv(
                [
                  t('reports.fields.item'),
                  t('reports.fields.onHand'),
                  t('reports.fields.unitPrice'),
                  t('reports.fields.value'),
                ],
                rawRows.map((r) => [r.name, r.on_hand, r.unit_price, r.value]),
              ),
            )
          }
        >
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="py-1 text-start font-medium">{t('reports.fields.item')}</th>
                <th className="py-1 text-end font-medium">{t('reports.fields.onHand')}</th>
                <th className="py-1 text-end font-medium">{t('reports.fields.value')}</th>
              </tr>
            </thead>
            <tbody>
              {rawRows.map((r) => (
                <tr key={r.raw_material_id} className="border-b border-border last:border-0">
                  <td className="py-1">{localName(r.name, r.name_ar)}</td>
                  <td className="py-1 text-end">{r.on_hand}</td>
                  <td className="py-1 text-end">{money(r.value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td className="py-1" colSpan={2}>
                  {t('reports.total')}
                </td>
                <td className="py-1 text-end">{money(totals.rawValue)}</td>
              </tr>
            </tfoot>
          </table>
        </ReportCard>
      </div>

      <Card className="text-xs text-muted">{t('reports.note')}</Card>
    </section>
  )
}
