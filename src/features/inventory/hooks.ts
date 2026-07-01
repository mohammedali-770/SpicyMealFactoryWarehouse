import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { StockLevel, StockMovement } from './types'

const INVENTORY_KEY = ['inventory']

/** On-hand levels for every warehouse item (RLS-scoped), by name. */
export function useStockLevels() {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('item_stock')
        .select('item_id, sku, name, name_ar, category, unit, on_hand')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as StockLevel[]
    },
  })
}

/** The ledger for one item, newest first. */
export function useItemMovements(itemId: string | null) {
  return useQuery({
    queryKey: [...INVENTORY_KEY, 'movements', itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('id, quantity, reason, note, order_id, created_at, orders(order_number)')
        .eq('item_id', itemId as string)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      // supabase-js infers the many-to-one `orders` embed as an array without generated
      // DB types; at runtime PostgREST returns a single object, so cast through unknown.
      return (data ?? []) as unknown as StockMovement[]
    },
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { itemId: string; quantity: number; note?: string }) => {
      const { error } = await supabase.rpc('adjust_item_stock', {
        p_item_id: input.itemId,
        p_quantity: input.quantity,
        p_note: input.note ?? null,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INVENTORY_KEY }),
  })
}
