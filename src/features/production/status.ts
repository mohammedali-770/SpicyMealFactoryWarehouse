import type { Role } from '@/lib/constants'
import type { BatchStatus } from './types'

export const BATCH_STATUSES: BatchStatus[] = ['pending', 'in_progress', 'completed', 'cancelled']

/** Roles that may plan/run production. Mirrors the DB authorization. */
export function managesProduction(role: Role | null): boolean {
  return role === 'admin' || role === 'general_manager' || role === 'factory_manager'
}

/**
 * Target statuses the actor may move a batch to. Mirrors set_batch_status() —
 * the database is the authoritative gate.
 */
export function allowedBatchTransitions(from: BatchStatus, canManage: boolean): BatchStatus[] {
  if (!canManage) return []
  if (from === 'pending') return ['in_progress', 'cancelled']
  if (from === 'in_progress') return ['completed', 'cancelled']
  return []
}
