import { useTranslation } from 'react-i18next'
import { OrdersView } from '@/features/orders/OrdersView'

export function GeneralManagerDashboard() {
  const { t } = useTranslation()
  return <OrdersView title={t('orders.title.gm')} />
}
