import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const noPersist = { auth: { autoRefreshToken: false, persistSession: false } }

/** Service-role client (full access). Never exposed to the browser. */
export function supabaseAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, noPersist)
}

/** Anon client, used only to validate a caller's JWT via auth.getUser(). */
export function supabaseAnon(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY')
  return createClient(url, key, noPersist)
}
