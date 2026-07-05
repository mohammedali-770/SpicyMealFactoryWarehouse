import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/** Singleton Supabase client. Uses the public anon key; RLS enforces access. */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
