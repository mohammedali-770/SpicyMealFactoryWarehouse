import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  BatchInput,
  BatchLine,
  BatchOutput,
  BatchRef,
  BatchStatus,
  ProductionBatchRow,
} from './types'

const BATCH_KEY = ['production-batches']

export interface BatchFilter {
  status?: BatchStatus | 'all'
}

/** Production batches visible to the current user (RLS-scoped), newest first. */
export function useProductionBatches(filter: BatchFilter = {}) {
  return useQuery({
    queryKey: [...BATCH_KEY, filter],
    queryFn: async () => {
      let query = supabase
        .from('production_batches')
        .select('*, batch_inputs(count), batch_outputs(count)')
        .order('created_at', { ascending: false })
      if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return (data ?? []) as ProductionBatchRow[]
    },
  })
}

export function useBatchInputs(batchId: string | null) {
  return useQuery({
    queryKey: ['production-batch', batchId, 'inputs'],
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_inputs')
        .select('id, raw_material_id, line_name, quantity')
        .eq('batch_id', batchId as string)
        .order('created_at')
      if (error) throw new Error(error.message)
      return (data ?? []) as BatchInput[]
    },
  })
}

export function useBatchOutputs(batchId: string | null) {
  return useQuery({
    queryKey: ['production-batch', batchId, 'outputs'],
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_outputs')
        .select('id, item_id, line_name, quantity')
        .eq('batch_id', batchId as string)
        .order('created_at')
      if (error) throw new Error(error.message)
      return (data ?? []) as BatchOutput[]
    },
  })
}

/** Active raw materials (inputs) for the batch builder. */
export function useRawMaterialRefs() {
  return useQuery({
    queryKey: ['batch-refs', 'raw_materials'],
    queryFn: async (): Promise<BatchRef[]> => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name, name_ar, unit')
        .eq('is_active', true)
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as BatchRef[]
    },
  })
}

/** Active warehouse items (outputs) for the batch builder. */
export function useWarehouseItemRefs() {
  return useQuery({
    queryKey: ['batch-refs', 'items'],
    queryFn: async (): Promise<BatchRef[]> => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, name_ar, unit')
        .eq('is_active', true)
        .eq('category', 'warehouse')
        .order('order_index')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as BatchRef[]
    },
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { inputs: BatchLine[]; outputs: BatchLine[]; notes?: string }) => {
      const { error } = await supabase.rpc('create_production_batch', {
        p_inputs: input.inputs,
        p_outputs: input.outputs,
        p_notes: input.notes ?? null,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BATCH_KEY }),
  })
}

export function useSetBatchStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { batchId: string; status: BatchStatus }) => {
      const { error } = await supabase.rpc('set_batch_status', {
        p_batch_id: input.batchId,
        p_status: input.status,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: BATCH_KEY })
      qc.invalidateQueries({ queryKey: ['production-batch', input.batchId] })
      // Completing a batch posts into both inventory ledgers.
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}
