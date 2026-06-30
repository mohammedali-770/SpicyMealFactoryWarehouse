import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { SignOutButton } from '@/components/layout/SignOutButton'

export function AppLayout() {
  const { t } = useTranslation()
  const { profile, role } = useAuth()

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex items-center justify-between bg-brand px-4 py-3 text-brand-fg">
        <span className="font-display text-lg font-bold">{t('app.name')}</span>
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
