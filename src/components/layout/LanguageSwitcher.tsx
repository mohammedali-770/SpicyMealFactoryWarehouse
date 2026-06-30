import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { useLocaleStore } from '@/stores/localeStore'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const toggleLanguage = useLocaleStore((s) => s.toggleLanguage)

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={t('lang.label')}
      className="inline-flex items-center gap-1 rounded-md border border-current/30 px-2 py-1 text-sm hover:bg-current/10"
    >
      <Languages size={16} aria-hidden />
      <span>{t('lang.toggle')}</span>
    </button>
  )
}
