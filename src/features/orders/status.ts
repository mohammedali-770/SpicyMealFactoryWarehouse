import type { Role } from '@/lib/constants'
import type { OrderCategory, OrderStatus } from './types'

export const ORDER_STATUSES: OrderStatus[] = [
  'draft',
  'pending',
  'approved',
  'completed',
  'cancelled',
]

export interface TransitionContext {
  role: Role | null
  /** True when the acting user is the order's own customer. */
  isOwner: boolean
  category: OrderCategory | null
}

/**
 * Whether the actor is a "manager" of an order in this category. Mirrors the
 * v_manages check in set_order_status: admin/GM manage any category; a
 * warehouse/factory manager only manages their own.
 */
export function managesCategory(role: Role | null, category: OrderCategory | null): boolean {
  if (role === 'admin' || role === 'general_manager') return true
  if (role === 'warehouse_manager') return category === 'warehouse'
  if (role === 'factory_manager') return category === 'factory'
  return false
}

/**
 * Target statuses the actor may move an order to. This is a UI convenience that
 * MUST mirror set_order_status() — the database is the authoritative gate.
 */
export function allowedTransitions(from: OrderStatus, ctx: TransitionContext): OrderStatus[] {
  const manages = managesCategory(ctx.role, ctx.category)
  const ownerCustomer = ctx.role === 'customer' && ctx.isOwner
  const out: OrderStatus[] = []

  if (from === 'draft' && (manages || ownerCustomer)) out.push('pending')
  if (from === 'pending' && manages) out.push('approved')
  if (from === 'approved' && manages) out.push('completed')
  if ((from === 'draft' || from === 'pending') && (manages || ownerCustomer)) out.push('cancelled')
  if (from === 'approved' && manages) out.push('cancelled')

  return out
}
