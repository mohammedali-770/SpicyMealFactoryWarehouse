import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { roleNav } from '@/app/router/roleNav'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { SignOutButton } from '@/components/layout/SignOutButton'

export function AppLayout() {
  const { t } = useTranslation()
  const { profile, role } = useAuth()
  const links = role ? roleNav[role] : []

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex items-center justify-between bg-brand px-4 py-3 text-brand-fg">
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold">{t('app.name')}</span>
          {links.length > 1 && (
            <nav className="flex items-center gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1 text-sm transition ${
                      isActive ? 'bg-white/20 font-medium' : 'opacity-90 hover:bg-white/10'
                    }`
                  }
                >
                  {t(link.labelKey)}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">{profile?.email ?? role}</span>
          <LanguageSwitcher />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
