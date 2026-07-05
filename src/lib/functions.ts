import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'

const base = env.VITE_FUNCTIONS_BASE_URL ?? `${env.VITE_SUPABASE_URL}/functions/v1`

/**
 * Call a privileged edge function, attaching the caller's session JWT so the
 * function's requireAdmin() gate can authorize. Throws on a non-2xx response.
 */
export async function invokeAdminFn<T = unknown>(name: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${base}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.VITE_SUPABASE_ANON_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  const json: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (json as { error?: string }).error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return json as T
}
