import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function SignOutButton() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="inline-flex items-center gap-1 rounded-md bg-current/10 px-2 py-1 text-sm hover:bg-current/20"
    >
      <LogOut size={16} aria-hidden />
      <span>{t('common.signOut')}</span>
    </button>
  )
}
