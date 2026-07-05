export type OrderStatus = 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled'
export type OrderCategory = 'warehouse' | 'factory'

export interface OrderRow {
  id: string
  order_number: string | null
  customer_id: string
  branch_id: string | null
  status: OrderStatus
  category: OrderCategory | null
  order_date: string
  total_amount: number
  notes: string | null
  approved_at: string | null
  completed_at: string | null
  created_at: string
  branches?: { name: string; name_ar: string | null } | null
  order_items?: { count: number }[]
}

export interface OrderLine {
  id: string
  item_id: string
  item_name: string | null
  item_serial: string | null
  quantity: number
  stock_level: number | null
  unit_price: number | null
  line_total: number | null
}

export interface OrderHistoryRow {
  id: string
  from_status: OrderStatus | null
  to_status: OrderStatus | null
  note: string | null
  created_at: string
}

/** A single cart line the customer submits to create_customer_order. */
export interface CartLine {
  item_id: string
  quantity: number
  stock_level?: number | null
}
