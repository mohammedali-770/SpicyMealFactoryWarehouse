import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  CartLine,
  OrderCategory,
  OrderHistoryRow,
  OrderLine,
  OrderRow,
  OrderStatus,
} from './types'

const ORDERS_KEY = ['orders']

export interface OrdersFilter {
  category?: OrderCategory
  status?: OrderStatus | 'all'
}

/** Orders visible to the current user (RLS-scoped), newest first. */
export function useOrders(filter: OrdersFilter = {}) {
  return useQuery({
    queryKey: [...ORDERS_KEY, filter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, branches(name, name_ar), order_items(count)')
        .order('created_at', { ascending: false })
      if (filter.category) query = query.eq('category', filter.category)
      if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return (data ?? []) as OrderRow[]
    },
  })
}

export function useOrderLines(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId, 'lines'],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(
          'id, item_id, item_name, item_serial, quantity, stock_level, unit_price, line_total',
        )
        .eq('order_id', orderId as string)
        .order('created_at')
      if (error) throw new Error(error.message)
      return (data ?? []) as OrderLine[]
    },
  })
}

export function useOrderHistory(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId, 'history'],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_history')
        .select('id, from_status, to_status, note, created_at')
        .eq('order_id', orderId as string)
        .order('created_at')
      if (error) throw new Error(error.message)
      return (data ?? []) as OrderHistoryRow[]
    },
  })
}

/** Active, categorised catalog items for the customer cart, in display order. */
export function useOrderableItems() {
  return useQuery({
    queryKey: ['orderable', 'items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, name_ar, sku, category, unit, unit_price, stock_level_required')
        .eq('is_active', true)
        .not('category', 'is', null)
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

/** Active, customer-facing branches for the cart's delivery location. */
export function useOrderableBranches() {
  return useQuery({
    queryKey: ['orderable', 'branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, name_ar')
        .eq('is_active', true)
        .eq('internal_only', false)
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { items: CartLine[]; branchId?: string | null; notes?: string }) => {
      const { data, error } = await supabase.rpc('create_customer_order', {
        p_items: input.items,
        p_branch_id: input.branchId ?? null,
        p_notes: input.notes ?? null,
      })
      if (error) throw new Error(error.message)
      return data as { orders: { id: string; order_number: string; category: OrderCategory }[] }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  })
}

export function useSetOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { orderId: string; status: OrderStatus; note?: string }) => {
      const { error } = await supabase.rpc('set_order_status', {
        p_order_id: input.orderId,
        p_status: input.status,
        p_note: input.note ?? null,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY })
      qc.invalidateQueries({ queryKey: ['order', input.orderId] })
    },
  })
}
