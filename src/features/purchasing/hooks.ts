import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  POCartLine,
  POKind,
  POLine,
  POStatus,
  PurchasableRef,
  PurchaseOrderRow,
} from './types'

const PO_KEY = ['purchase-orders']

export interface POFilter {
  kind?: POKind
  status?: POStatus | 'all'
}

/** Purchase orders visible to the current user (RLS-scoped), newest first. */
export function usePurchaseOrders(filter: POFilter = {}) {
  return useQuery({
    queryKey: [...PO_KEY, filter],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select('*, suppliers(name, name_ar), purchase_order_items(count)')
        .order('created_at', { ascending: false })
      if (filter.kind) query = query.eq('kind', filter.kind)
      if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return (data ?? []) as PurchaseOrderRow[]
    },
  })
}

export function usePurchaseOrderLines(poId: string | null) {
  return useQuery({
    queryKey: ['purchase-order', poId, 'lines'],
    enabled: !!poId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select(
          'id, item_id, raw_material_id, line_name, line_serial, quantity, unit_price, line_total',
        )
        .eq('po_id', poId as string)
        .order('created_at')
      if (error) throw new Error(error.message)
      return (data ?? []) as POLine[]
    },
  })
}

/** Active suppliers for the PO header. */
export function useActiveSuppliers() {
  return useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, name_ar')
        .eq('is_active', true)
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

/** Orderable reference rows for a PO kind: warehouse items or raw materials. */
export function usePurchasableRefs(kind: POKind) {
  return useQuery({
    queryKey: ['purchasable', kind],
    queryFn: async (): Promise<PurchasableRef[]> => {
      if (kind === 'warehouse') {
        const { data, error } = await supabase
          .from('items')
          .select('id, name, name_ar, unit, unit_price, sku')
          .eq('is_active', true)
          .eq('category', 'warehouse')
          .order('order_index')
          .order('name')
        if (error) throw new Error(error.message)
        return (data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          name_ar: r.name_ar,
          unit: r.unit,
          unit_price: r.unit_price,
          serial: r.sku,
        }))
      }
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name, name_ar, unit, unit_price')
        .eq('is_active', true)
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        unit: r.unit,
        unit_price: r.unit_price,
        serial: null,
      }))
    },
  })
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      kind: POKind
      supplierId: string
      items: POCartLine[]
      notes?: string
    }) => {
      const { error } = await supabase.rpc('create_purchase_order', {
        p_kind: input.kind,
        p_supplier_id: input.supplierId,
        p_items: input.items,
        p_notes: input.notes ?? null,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PO_KEY }),
  })
}

export function useSetPurchaseOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { poId: string; status: POStatus }) => {
      const { error } = await supabase.rpc('set_purchase_order_status', {
        p_po_id: input.poId,
        p_status: input.status,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: PO_KEY })
      qc.invalidateQueries({ queryKey: ['purchase-order', input.poId] })
      // Receiving posts into the inventory ledgers.
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
