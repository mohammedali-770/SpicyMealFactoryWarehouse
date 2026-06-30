import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import type { Role } from '@/lib/constants'

/** Empty per-role dashboard for the Phase 1 foundation. */
export function DashboardPlaceholder({ role }: { role: Role }) {
  const { t } = useTranslation()
  return (
    <section className="space-y-4" data-testid={`dashboard-${role}`}>
      <h1 className="font-display text-2xl font-bold text-ink">{t(`dashboard.${role}.title`)}</h1>
      <Card>
        <p className="text-muted">{t(`dashboard.${role}.empty`)}</p>
      </Card>
    </section>
  )
}
