import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OrdersView } from '@/features/orders/OrdersView'
import { NewOrderModal } from '@/features/orders/NewOrderModal'

export function CustomerDashboard() {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <OrdersView
        title={t('orders.title.customer')}
        action={
          <Button type="button" onClick={() => setCreating(true)}>
            <Plus size={16} className="me-1" aria-hidden /> {t('orders.new.title')}
          </Button>
        }
      />
      {creating && <NewOrderModal onClose={() => setCreating(false)} />}
    </>
  )
}
