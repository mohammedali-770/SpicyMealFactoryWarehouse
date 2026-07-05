/** Business roles. Mirrors the `public.user_role` enum in the database. */
export const ROLES = [
  'admin',
  'customer',
  'warehouse_manager',
  'factory_manager',
  'general_manager',
  'accountant',
] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Business timezone for day-boundary logic (UTC+3, no DST). */
export const BUSINESS_TZ = 'Asia/Riyadh'
