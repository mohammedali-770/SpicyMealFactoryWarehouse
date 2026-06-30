import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/lib/constants'
import { roleHome } from '@/app/router/roleHome'
import { FullScreenSpinner } from '@/components/ui/Spinner'

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role, loading } = useAuth()

  if (loading) return <FullScreenSpinner />
  if (!role) return <Navigate to="/login" replace />
  if (!allow.includes(role)) return <Navigate to={roleHome[role]} replace />
  return children
}
