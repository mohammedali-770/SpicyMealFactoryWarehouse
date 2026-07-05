import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="space-y-4 text-center">
      <h1 className="font-display text-2xl font-bold">{t('notFound.title')}</h1>
      <Link to="/" className="text-brand underline">
        {t('notFound.back')}
      </Link>
    </section>
  )
}
