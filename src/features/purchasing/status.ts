import type { Role } from '@/lib/constants'
import type { POKind, POStatus } from './types'

export const PO_STATUSES: POStatus[] = ['draft', 'pending', 'approved', 'received', 'cancelled']

/** Which PO kinds this role may create/manage. Mirrors the DB authorization. */
export function managesKind(role: Role | null, kind: POKind): boolean {
  if (role === 'admin' || role === 'general_manager') return true
  if (role === 'warehouse_manager') return kind === 'warehouse'
  if (role === 'factory_manager') return kind === 'raw_material'
  return false
}

/** The kinds this role can create a new PO for (empty = read-only). */
export function creatableKinds(role: Role | null): POKind[] {
  return (['warehouse', 'raw_material'] as POKind[]).filter((k) => managesKind(role, k))
}

/**
 * Target statuses the actor may move a PO to. Mirrors set_purchase_order_status()
 * — the database is the authoritative gate.
 */
export function allowedPurchaseTransitions(
  from: POStatus,
  ctx: { role: Role | null; kind: POKind },
): POStatus[] {
  if (!managesKind(ctx.role, ctx.kind)) return []
  if (from === 'pending') return ['approved', 'cancelled']
  if (from === 'approved') return ['received', 'cancelled']
  return []
}
