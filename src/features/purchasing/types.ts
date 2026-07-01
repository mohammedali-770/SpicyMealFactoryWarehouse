export type POStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'
export type POKind = 'warehouse' | 'raw_material'

export interface PurchaseOrderRow {
  id: string
  po_number: string | null
  kind: POKind
  supplier_id: string
  status: POStatus
  notes: string | null
  total_amount: number
  approved_at: string | null
  received_at: string | null
  order_date: string
  created_at: string
  suppliers?: { name: string; name_ar: string | null } | null
  purchase_order_items?: { count: number }[]
}

export interface POLine {
  id: string
  item_id: string | null
  raw_material_id: string | null
  line_name: string | null
  line_serial: string | null
  quantity: number
  unit_price: number
  line_total: number | null
}

/** A reference row the buyer can add to a PO (a warehouse item or a raw material). */
export interface PurchasableRef {
  id: string
  name: string
  name_ar: string | null
  unit: string
  unit_price: number
  serial: string | null
}

/** A single line the buyer submits to create_purchase_order. */
export interface POCartLine {
  ref_id: string
  quantity: number
  unit_price?: number | null
}
