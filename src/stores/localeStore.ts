import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/i18n'

interface LocaleState {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'ar' : 'en' }),
    }),
    { name: 'smfw.locale' },
  ),
)
