import { useTranslation } from 'react-i18next'
import { OrdersView } from '@/features/orders/OrdersView'

export function FactoryDashboard() {
  const { t } = useTranslation()
  return <OrdersView title={t('orders.title.factory')} category="factory" />
}
