import { describe, it, expect } from 'vitest'
import {
  itemsToWorkbookBuffer,
  workbookBufferToRows,
  validateImportRows,
} from '@/features/admin/excel'

describe('items Excel round-trip', () => {
  it('exports then imports the same rows', async () => {
    const items = [
      {
        sku: 'SKU1',
        name: 'Chicken Breast',
        name_ar: 'صدر دجاج',
        category: 'warehouse',
        unit: 'kg',
        unit_price: 12.5,
        order_index: 0,
        is_active: true,
      },
      {
        sku: 'SKU2',
        name: 'Whole Chicken',
        name_ar: 'دجاج كامل',
        category: 'factory',
        unit: 'kg',
        unit_price: 20,
        order_index: 1,
        is_active: false,
      },
    ]

    const buffer = await itemsToWorkbookBuffer(items)
    const rows = await workbookBufferToRows(buffer)
    const { valid, errors } = validateImportRows(rows)

    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(2)
    expect(valid[0]).toMatchObject({
      sku: 'SKU1',
      name: 'Chicken Breast',
      unit_price: 12.5,
      is_active: true,
    })
    expect(valid[1]).toMatchObject({
      sku: 'SKU2',
      category: 'factory',
      unit_price: 20,
      is_active: false,
    })
  })

  it('reports row errors for invalid rows', async () => {
    const buffer = await itemsToWorkbookBuffer([{ sku: 'X', name: '', unit_price: -1 }])
    const rows = await workbookBufferToRows(buffer)
    const { valid, errors } = validateImportRows(rows)
    expect(valid).toHaveLength(0)
    expect(errors.length).toBeGreaterThan(0)
  })
})
