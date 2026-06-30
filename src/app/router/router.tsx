import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from '@/app/router/RequireAuth'
import { RoleGuard } from '@/app/router/RoleGuard'
import { RoleHomeRedirect } from '@/app/router/RoleHomeRedirect'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/components/layout/NotFoundPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { AdminDashboard } from '@/features/dashboards/AdminDashboard'
import { CustomerDashboard } from '@/features/dashboards/CustomerDashboard'
import { WarehouseDashboard } from '@/features/dashboards/WarehouseDashboard'
import { FactoryDashboard } from '@/features/dashboards/FactoryDashboard'
import { GeneralManagerDashboard } from '@/features/dashboards/GeneralManagerDashboard'
import { AccountantDashboard } from '@/features/dashboards/AccountantDashboard'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      {
        path: 'admin',
        element: (
          <RoleGuard allow={['admin']}>
            <AdminDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'customer',
        element: (
          <RoleGuard allow={['admin', 'customer']}>
            <CustomerDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'warehouse',
        element: (
          <RoleGuard allow={['admin', 'warehouse_manager']}>
            <WarehouseDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'factory',
        element: (
          <RoleGuard allow={['admin', 'factory_manager']}>
            <FactoryDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'gm',
        element: (
          <RoleGuard allow={['admin', 'general_manager']}>
            <GeneralManagerDashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'accountant',
        element: (
          <RoleGuard allow={['admin', 'accountant']}>
            <AccountantDashboard />
          </RoleGuard>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
