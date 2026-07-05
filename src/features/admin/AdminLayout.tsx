import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TABS = [
  { to: '/admin/users', key: 'admin.tabs.users' },
  { to: '/admin/branches', key: 'admin.tabs.branches' },
  { to: '/admin/items', key: 'admin.tabs.items' },
  { to: '/admin/suppliers', key: 'admin.tabs.suppliers' },
  { to: '/admin/raw-materials', key: 'admin.tabs.rawMaterials' },
]

export function AdminLayout() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `rounded-t-md px-4 py-2 text-sm font-medium ${
                isActive ? 'border-b-2 border-brand text-brand' : 'text-muted hover:text-ink'
              }`
            }
          >
            {t(tab.key)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
