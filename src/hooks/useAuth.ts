import { useContext } from 'react'
import { AuthContext } from '@/app/providers/AuthProvider'
import type { AuthContextValue } from '@/app/providers/AuthProvider'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
