import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  DateRange,
  ItemValuationRow,
  ProductionDailyRow,
  PurchaseDailyRow,
  RawMaterialValuationRow,
  SalesDailyRow,
} from './types'

function ranged(table: string, range: DateRange) {
  return supabase
    .from(table)
    .select('*')
    .gte('business_day', range.from)
    .lte('business_day', range.to)
    .order('business_day')
}

export function useSalesDaily(range: DateRange) {
  return useQuery({
    queryKey: ['report', 'sales', range],
    queryFn: async () => {
      const { data, error } = await ranged('report_sales_daily', range)
      if (error) throw new Error(error.message)
      return (data ?? []) as SalesDailyRow[]
    },
  })
}

export function usePurchaseDaily(range: DateRange) {
  return useQuery({
    queryKey: ['report', 'purchases', range],
    queryFn: async () => {
      const { data, error } = await ranged('report_purchase_daily', range)
      if (error) throw new Error(error.message)
      return (data ?? []) as PurchaseDailyRow[]
    },
  })
}

export function useProductionDaily(range: DateRange) {
  return useQuery({
    queryKey: ['report', 'production', range],
    queryFn: async () => {
      const { data, error } = await ranged('report_production_daily', range)
      if (error) throw new Error(error.message)
      return (data ?? []) as ProductionDailyRow[]
    },
  })
}

export function useItemValuation() {
  return useQuery({
    queryKey: ['report', 'item-valuation'],
    queryFn: async () => {
      const { data, error } = await supabase.from('report_item_valuation').select('*').order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as ItemValuationRow[]
    },
  })
}

export function useRawMaterialValuation() {
  return useQuery({
    queryKey: ['report', 'raw-valuation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_raw_material_valuation')
        .select('*')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as RawMaterialValuationRow[]
    },
  })
}
