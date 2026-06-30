import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { router } from '@/app/router/router'

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
