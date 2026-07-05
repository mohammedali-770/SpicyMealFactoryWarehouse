import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CrudRow {
  id: string
  is_active: boolean
  order_index: number
  [key: string]: unknown
}

/** Generic TanStack Query CRUD hooks for a soft-deletable, reorderable table. */
export function makeCrud(table: string) {
  const baseKey: QueryKey = ['admin', table]

  function useList(includeInactive: boolean) {
    return useQuery({
      queryKey: [...baseKey, { includeInactive }],
      queryFn: async () => {
        let query = supabase.from(table).select('*').order('order_index').order('created_at')
        if (!includeInactive) query = query.eq('is_active', true)
        const { data, error } = await query
        if (error) throw new Error(error.message)
        return (data ?? []) as CrudRow[]
      },
    })
  }

  function useSave() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (row: Record<string, unknown> & { id?: string }) => {
        const { id, ...values } = row
        const result = id
          ? await supabase.from(table).update(values).eq('id', id)
          : await supabase.from(table).insert(values)
        if (result.error) throw new Error(result.error.message)
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
    })
  }

  function useSetActive() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
        const { error } = await supabase.from(table).update({ is_active }).eq('id', id)
        if (error) throw new Error(error.message)
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
    })
  }

  function useReorder() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (updates: { id: string; order_index: number }[]) => {
        for (const u of updates) {
          const { error } = await supabase
            .from(table)
            .update({ order_index: u.order_index })
            .eq('id', u.id)
          if (error) throw new Error(error.message)
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
    })
  }

  return { baseKey, useList, useSave, useSetActive, useReorder }
}
