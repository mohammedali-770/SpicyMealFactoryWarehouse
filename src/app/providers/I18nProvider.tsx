import { useEffect } from 'react'
import type { ReactNode } from 'react'
import i18n from '@/i18n'
import { useLocaleStore } from '@/stores/localeStore'

/** Keeps i18next + <html lang/dir> in sync with the locale store. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useLocaleStore((s) => s.language)

  useEffect(() => {
    void i18n.changeLanguage(language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  return children
}
