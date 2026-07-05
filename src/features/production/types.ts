export type BatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface ProductionBatchRow {
  id: string
  batch_number: string | null
  status: BatchStatus
  notes: string | null
  started_at: string | null
  completed_at: string | null
  order_date: string
  created_at: string
  batch_inputs?: { count: number }[]
  batch_outputs?: { count: number }[]
}

export interface BatchInput {
  id: string
  raw_material_id: string
  line_name: string | null
  quantity: number
}

export interface BatchOutput {
  id: string
  item_id: string
  line_name: string | null
  quantity: number
}

/** A reference row (raw material or warehouse item) selectable in the batch builder. */
export interface BatchRef {
  id: string
  name: string
  name_ar: string | null
  unit: string
}

/** A single line the operator submits to create_production_batch. */
export interface BatchLine {
  ref_id: string
  quantity: number
}
