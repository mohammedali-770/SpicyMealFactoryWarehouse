import { useTranslation } from 'react-i18next'
import { OrdersView } from '@/features/orders/OrdersView'

export function AccountantDashboard() {
  const { t } = useTranslation()
  return <OrdersView title={t('orders.title.accountant')} />
}
