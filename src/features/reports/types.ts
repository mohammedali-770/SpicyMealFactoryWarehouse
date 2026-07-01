export interface DateRange {
  from: string
  to: string
}

export interface SalesDailyRow {
  business_day: string
  category: 'warehouse' | 'factory' | null
  order_count: number
  revenue: number
}

export interface PurchaseDailyRow {
  business_day: string
  kind: 'warehouse' | 'raw_material'
  po_count: number
  spend: number
}

export interface ProductionDailyRow {
  business_day: string
  batch_count: number
  output_qty: number
}

export interface ItemValuationRow {
  item_id: string
  sku: string | null
  name: string
  name_ar: string | null
  unit: string
  on_hand: number
  unit_price: number
  value: number
}

export interface RawMaterialValuationRow {
  raw_material_id: string
  name: string
  name_ar: string | null
  unit: string
  on_hand: number
  unit_price: number
  value: number
}
