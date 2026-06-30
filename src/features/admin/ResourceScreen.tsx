import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, ArrowUp, ArrowDown, Download, Upload } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { formatSAR } from '@/lib/currency'
import { useLocaleStore } from '@/stores/localeStore'
import { supabase } from '@/lib/supabase'
import { makeCrud, type CrudRow } from './crud'
import { ResourceForm } from './ResourceForm'
import type { ColumnConfig, ResourceConfig } from './types'
import { downloadItemsXlsx, readXlsxFile, type ItemRow } from './excel'

function renderCell(
  col: ColumnConfig,
  row: CrudRow,
  locale: 'en' | 'ar',
  activeLabel: string,
  inactiveLabel: string,
) {
  const value = row[col.key]
  if (col.kind === 'money') return formatSAR(Number(value ?? 0), locale)
  if (col.kind === 'bool') return value ? activeLabel : inactiveLabel
  if (col.kind === 'image') {
    return value ? (
      <img
        src={String(value)}
        alt=""
        className="h-10 w-10 rounded object-cover"
        data-testid="item-row-image"
      />
    ) : (
      <span className="text-muted">—</span>
    )
  }
  return value == null || value === '' ? <span className="text-muted">—</span> : String(value)
}

export function ResourceScreen({ config }: { config: ResourceConfig }) {
  const { t } = useTranslation()
  const language = useLocaleStore((s) => s.language)
  const crud = useMemo(() => makeCrud(config.table), [config.table])
  const [includeInactive, setIncludeInactive] = useState(false)
  const list = crud.useList(includeInactive)
  const save = crud.useSave()
  const setActive = crud.useSetActive()
  const reorder = crud.useReorder()

  const [editing, setEditing] = useState<CrudRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const rows = list.data ?? []

  async function move(index: number, dir: -1 | 1) {
    const a = rows[index]
    const b = rows[index + dir]
    if (!a || !b) return
    await reorder.mutateAsync([
      { id: a.id, order_index: b.order_index },
      { id: b.id, order_index: a.order_index },
    ])
  }

  async function onImport(file?: File) {
    if (!file) return
    setImportMsg(null)
    const { valid, errors } = await readXlsxFile(file)
    for (const r of valid) {
      await supabase
        .from('items')
        .upsert({ ...r, category: r.category || null, sku: r.sku || null }, { onConflict: 'sku' })
    }
    await list.refetch()
    setImportMsg(t('admin.items.importSummary', { ok: valid.length, errors: errors.length }))
  }

  return (
    <section className="space-y-4" data-testid={`admin-${config.table}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold text-ink">{t(`${config.i18nKey}.title`)}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-muted">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            {t('common.showInactive')}
          </label>
          {config.hasExcel && (
            <>
              <Button
                type="button"
                className="bg-muted"
                onClick={() => void downloadItemsXlsx(rows as unknown as Partial<ItemRow>[])}
              >
                <Download size={16} className="me-1" aria-hidden /> {t('admin.items.export')}
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-md bg-muted px-4 py-2 font-medium text-brand-fg hover:opacity-90">
                <Upload size={16} className="me-1" aria-hidden /> {t('admin.items.import')}
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => void onImport(e.target.files?.[0])}
                />
              </label>
            </>
          )}
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus size={16} className="me-1" aria-hidden /> {t('common.add')}
          </Button>
        </div>
      </div>

      {importMsg && (
        <p className="text-sm text-muted" role="status">
          {importMsg}
        </p>
      )}

      {list.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : list.error ? (
        <Card>
          <p className="text-danger">{(list.error as Error).message}</p>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <p className="text-muted">{t('common.empty')}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key} className="px-4 py-2 text-start font-medium">
                    {t(c.labelKey)}
                  </th>
                ))}
                <th className="px-4 py-2 text-start font-medium">{t('common.status')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  {config.columns.map((c) => (
                    <td key={c.key} className="px-4 py-2">
                      {renderCell(c, row, language, t('common.active'), t('common.inactive'))}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}
                    >
                      {row.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        aria-label={t('common.moveUp')}
                        disabled={i === 0}
                        onClick={() => void move(i, -1)}
                        className="rounded p-1 hover:bg-surface disabled:opacity-30"
                      >
                        <ArrowUp size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t('common.moveDown')}
                        disabled={i === rows.length - 1}
                        onClick={() => void move(i, 1)}
                        className="rounded p-1 hover:bg-surface disabled:opacity-30"
                      >
                        <ArrowDown size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t('common.edit')}
                        onClick={() => setEditing(row)}
                        className="rounded p-1 hover:bg-surface"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void setActive.mutateAsync({ id: row.id, is_active: !row.is_active })
                        }
                        className="rounded px-2 py-1 text-xs hover:bg-surface"
                      >
                        {row.is_active ? t('common.deactivate') : t('common.activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(creating || editing) && (
        <Modal
          title={editing ? t('common.edit') : t('common.add')}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <ResourceForm
            config={config}
            initial={editing}
            onClose={() => {
              setCreating(false)
              setEditing(null)
            }}
            onSaved={(values) => save.mutateAsync(values)}
          />
        </Modal>
      )}
    </section>
  )
}
