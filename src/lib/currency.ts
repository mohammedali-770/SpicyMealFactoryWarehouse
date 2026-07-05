export type CurrencyLocale = 'en' | 'ar'

// Western digits in both locales for unambiguous financial documents.
const LOCALE_TAG: Record<CurrencyLocale, string> = {
  en: 'en-US',
  ar: 'ar-SA-u-nu-latn',
}

const cache = new Map<CurrencyLocale, Intl.NumberFormat>()

function getFormatter(locale: CurrencyLocale): Intl.NumberFormat {
  let formatter = cache.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: 'currency',
      currency: 'SAR',
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    cache.set(locale, formatter)
  }
  return formatter
}

/** Format an amount as SAR currency (e.g. "SAR 1,234.50"). */
export function formatSAR(amount: number, locale: CurrencyLocale = 'en'): string {
  return getFormatter(locale).format(amount)
}
