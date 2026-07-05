import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { roleHome } from '@/app/router/roleHome'

/** Index route: send an authenticated user to their role's dashboard. */
export function RoleHomeRedirect() {
  const { role } = useAuth()
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={roleHome[role]} replace />
}
