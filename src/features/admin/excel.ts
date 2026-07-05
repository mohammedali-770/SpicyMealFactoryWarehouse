import { z } from 'zod'

// exceljs is heavy and CJS — load it dynamically (code-split) and tolerate interop.
async function loadExcel() {
  const mod = (await import('exceljs')) as unknown as { default?: unknown }
  return (mod.default ?? mod) as typeof import('exceljs')
}

export const ITEM_COLUMNS = [
  'sku',
  'name',
  'name_ar',
  'category',
  'unit',
  'unit_price',
  'order_index',
  'is_active',
] as const

export interface ItemRow {
  sku: string
  name: string
  name_ar: string
  category: string
  unit: string
  unit_price: number
  order_index: number
  is_active: boolean
}

export const itemImportRowSchema = z.object({
  sku: z.string().trim().optional().or(z.literal('')),
  name: z.string().trim().min(1, { message: 'admin.errors.required' }),
  name_ar: z.string().trim().optional().or(z.literal('')),
  category: z.enum(['warehouse', 'factory']).optional().or(z.literal('')),
  unit: z.string().trim().optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0, { message: 'admin.errors.nonNegative' }),
  order_index: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
})

export async function itemsToWorkbookBuffer(items: Partial<ItemRow>[]): Promise<ArrayBuffer> {
  const ExcelJS = await loadExcel()
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Items')
  ws.columns = ITEM_COLUMNS.map((c) => ({ header: c, key: c, width: 18 }))
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  for (const item of items) ws.addRow(item)
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer
}

export async function workbookBufferToRows(data: ArrayBuffer): Promise<Record<string, unknown>[]> {
  const ExcelJS = await loadExcel()
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(data)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const headers: string[] = []
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.value ?? '').trim()
  })

  const rows: Record<string, unknown>[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Record<string, unknown> = {}
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col]
      if (key) obj[key] = cell.value ?? ''
    })
    rows.push(obj)
  })
  return rows
}

export interface ImportResult {
  valid: ItemRow[]
  errors: { row: number; message: string }[]
}

export function validateImportRows(rows: Record<string, unknown>[]): ImportResult {
  const valid: ItemRow[] = []
  const errors: { row: number; message: string }[] = []
  rows.forEach((raw, i) => {
    const parsed = itemImportRowSchema.safeParse(raw)
    if (parsed.success) {
      const d = parsed.data
      valid.push({
        sku: d.sku ?? '',
        name: d.name,
        name_ar: d.name_ar ?? '',
        category: d.category ?? '',
        unit: d.unit ?? '',
        unit_price: d.unit_price,
        order_index: d.order_index ?? 0,
        is_active: d.is_active ?? true,
      })
    } else {
      errors.push({ row: i + 2, message: parsed.error.issues[0]?.message ?? 'invalid' })
    }
  })
  return { valid, errors }
}

// ---- Browser-only helpers ----

export async function downloadItemsXlsx(
  items: Partial<ItemRow>[],
  filename = 'items.xlsx',
): Promise<void> {
  const buffer = await itemsToWorkbookBuffer(items)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function readXlsxFile(file: File): Promise<ImportResult> {
  const rows = await workbookBufferToRows(await file.arrayBuffer())
  return validateImportRows(rows)
}
