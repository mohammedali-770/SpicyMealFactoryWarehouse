export type MovementReason = 'order_fulfillment' | 'adjustment' | 'purchase_receipt'

export interface StockLevel {
  item_id: string
  sku: string | null
  name: string
  name_ar: string | null
  category: 'warehouse'
  unit: string
  on_hand: number
}

export interface RawMaterialLevel {
  raw_material_id: string
  name: string
  name_ar: string | null
  unit: string
  on_hand: number
}

export interface StockMovement {
  id: string
  quantity: number
  reason: MovementReason
  note: string | null
  order_id: string | null
  created_at: string
  orders?: { order_number: string | null } | null
}
