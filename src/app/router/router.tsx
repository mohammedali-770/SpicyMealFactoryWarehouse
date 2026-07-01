import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/app/router/RequireAuth'
import { RoleGuard } from '@/app/router/RoleGuard'
import { RoleHomeRedirect } from '@/app/router/RoleHomeRedirect'
import { AppLayout } from '@/components/layout/AppLayout'
import { NotFoundPage } from '@/components/layout/NotFoundPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { AdminLayout } from '@/features/admin/AdminLayout'
import { ResourceScreen } from '@/features/admin/ResourceScreen'
import { UsersScreen } from '@/features/admin/users/UsersScreen'
import {
  branchesConfig,
  itemsConfig,
  rawMaterialsConfig,
  suppliersConfig,
} from '@/features/admin/resources'
import { InventoryScreen } from '@/features/inventory/InventoryScreen'
import { PurchasingScreen } from '@/features/purchasing/PurchasingScreen'
import { ProductionScreen } from '@/features/production/ProductionScreen'
import { ReportsScreen } from '@/features/reports/ReportsScreen'
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
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <Navigate to="/admin/users" replace /> },
          { path: 'users', element: <UsersScreen /> },
          { path: 'branches', element: <ResourceScreen config={branchesConfig} /> },
          { path: 'items', element: <ResourceScreen config={itemsConfig} /> },
          { path: 'suppliers', element: <ResourceScreen config={suppliersConfig} /> },
          { path: 'raw-materials', element: <ResourceScreen config={rawMaterialsConfig} /> },
        ],
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
      {
        path: 'inventory',
        element: (
          <RoleGuard allow={['admin', 'warehouse_manager', 'general_manager', 'accountant']}>
            <InventoryScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'purchasing',
        element: (
          <RoleGuard
            allow={[
              'admin',
              'warehouse_manager',
              'factory_manager',
              'general_manager',
              'accountant',
            ]}
          >
            <PurchasingScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'production',
        element: (
          <RoleGuard allow={['admin', 'factory_manager', 'general_manager', 'accountant']}>
            <ProductionScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allow={['admin', 'general_manager', 'accountant']}>
            <ReportsScreen />
          </RoleGuard>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
