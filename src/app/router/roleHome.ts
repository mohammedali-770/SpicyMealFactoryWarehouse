import type { Role } from '@/lib/constants'

/** Default landing route per role. */
export const roleHome: Record<Role, string> = {
  admin: '/admin',
  customer: '/customer',
  warehouse_manager: '/warehouse',
  factory_manager: '/factory',
  general_manager: '/gm',
  accountant: '/accountant',
}
