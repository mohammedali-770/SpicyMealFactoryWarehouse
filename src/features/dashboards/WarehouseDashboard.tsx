import { useTranslation } from 'react-i18next'
import { OrdersView } from '@/features/orders/OrdersView'

export function WarehouseDashboard() {
  const { t } = useTranslation()
  return <OrdersView title={t('orders.title.warehouse')} category="warehouse" />
}
