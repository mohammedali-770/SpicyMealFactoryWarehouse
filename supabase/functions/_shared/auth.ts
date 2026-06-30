import { supabaseAnon } from './supabaseAdmin.ts'

export class AuthError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

export interface Caller {
  id: string
  email: string | null
  role: string | null
}

// Injectable so the authz gate can be unit-tested without a live Supabase.
export type GetUser = (jwt: string) => Promise<Caller | null>

const defaultGetUser: GetUser = async (jwt) => {
  const { data, error } = await supabaseAnon().auth.getUser(jwt)
  if (error || !data.user) return null
  const role = (data.user.app_metadata as { role?: string } | null)?.role ?? null
  return { id: data.user.id, email: data.user.email ?? null, role }
}

/**
 * Verify the caller's JWT and require the `admin` business role.
 * Throws AuthError(401) for a missing/invalid token, AuthError(403) for non-admins.
 */
export async function requireAdmin(
  req: Request,
  getUser: GetUser = defaultGetUser,
): Promise<Caller> {
  const header = req.headers.get('Authorization') ?? ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new AuthError(401, 'Missing bearer token')

  const caller = await getUser(token)
  if (!caller) throw new AuthError(401, 'Invalid or expired token')
  if (caller.role !== 'admin') throw new AuthError(403, 'Admin role required')
  return caller
}
