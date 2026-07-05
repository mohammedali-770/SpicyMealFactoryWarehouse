import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isRole } from '@/lib/constants'
import type { Role } from '@/lib/constants'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: Role
  branch_id: string | null
  is_active: boolean
}

export interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  /** Authoritative role from the JWT app_metadata claim (matches RLS). */
  role: Role | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function roleFromSession(session: Session | null): Role | null {
  const claim = session?.user?.app_metadata?.role
  return isRole(claim) ? claim : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, branch_id, is_active')
        .eq('id', userId)
        .maybeSingle()
      if (active) setProfile((data as Profile | null) ?? null)
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) void loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (nextSession?.user) {
        void loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    setSession(null)
    setProfile(null)
    await supabase.auth.signOut({ scope: 'local' })
  }

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, role: roleFromSession(session), loading, signOut }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
