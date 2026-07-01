import type { Role } from '@/lib/constants'

export interface NavLink {
  to: string
  labelKey: string
}

/**
 * Header navigation per role. Roles with a single destination render no nav
 * (their landing screen is the whole app for them); multi-screen roles get links.
 */
export const roleNav: Record<Role, NavLink[]> = {
  admin: [
    { to: '/admin', labelKey: 'nav.admin' },
    { to: '/inventory', labelKey: 'nav.inventory' },
    { to: '/purchasing', labelKey: 'nav.purchasing' },
    { to: '/production', labelKey: 'nav.production' },
    { to: '/reports', labelKey: 'nav.reports' },
  ],
  customer: [{ to: '/customer', labelKey: 'nav.orders' }],
  warehouse_manager: [
    { to: '/warehouse', labelKey: 'nav.orders' },
    { to: '/inventory', labelKey: 'nav.inventory' },
    { to: '/purchasing', labelKey: 'nav.purchasing' },
  ],
  factory_manager: [
    { to: '/factory', labelKey: 'nav.orders' },
    { to: '/purchasing', labelKey: 'nav.purchasing' },
    { to: '/production', labelKey: 'nav.production' },
  ],
  general_manager: [
    { to: '/gm', labelKey: 'nav.orders' },
    { to: '/inventory', labelKey: 'nav.inventory' },
    { to: '/purchasing', labelKey: 'nav.purchasing' },
    { to: '/production', labelKey: 'nav.production' },
    { to: '/reports', labelKey: 'nav.reports' },
  ],
  accountant: [
    { to: '/accountant', labelKey: 'nav.orders' },
    { to: '/inventory', labelKey: 'nav.inventory' },
    { to: '/purchasing', labelKey: 'nav.purchasing' },
    { to: '/production', labelKey: 'nav.production' },
    { to: '/reports', labelKey: 'nav.reports' },
  ],
}
