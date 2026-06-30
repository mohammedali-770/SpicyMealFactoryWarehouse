import { AuthError, requireAdmin } from '../_shared/auth.ts'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { logRequest } from '../_shared/log.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { updateUserSchema } from '../_shared/schemas.ts'

export async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID()
  const started = Date.now()

  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, req)

  try {
    const caller = await requireAdmin(req)

    const parsed = updateUserSchema.safeParse(await req.json())
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid payload', issues: parsed.error.issues }, 400, req)
    }
    const { id, email, password, full_name, role, branch_id, is_active } = parsed.data

    const admin = supabaseAdmin()

    // Role flows through app_metadata (authoritative for the JWT/RLS); the
    // on_auth_user_updated trigger mirrors it into profiles.role.
    const attributes: {
      app_metadata: { role: string }
      user_metadata: { full_name: string }
      email?: string
      password?: string
    } = { app_metadata: { role }, user_metadata: { full_name } }
    if (email) attributes.email = email
    if (password && password.length > 0) attributes.password = password

    const { data, error } = await admin.auth.admin.updateUserById(id, attributes)
    if (error) {
      logRequest({
        requestId,
        action: 'admin-update-user',
        caller: caller.id,
        outcome: 'error',
        status: 400,
        ms: Date.now() - started,
      })
      return jsonResponse({ error: error.message }, 400, req)
    }

    // Mirror non-auth profile fields (full_name/branch_id/is_active).
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name,
        branch_id: branch_id ?? null,
        ...(is_active === undefined ? {} : { is_active }),
      })
      .eq('id', id)
    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400, req)
    }

    logRequest({
      requestId,
      action: 'admin-update-user',
      caller: caller.id,
      outcome: 'updated',
      status: 200,
      ms: Date.now() - started,
    })
    return jsonResponse({ success: true, user: data.user }, 200, req)
  } catch (e) {
    if (e instanceof AuthError) {
      logRequest({
        requestId,
        action: 'admin-update-user',
        outcome: 'authz_denied',
        status: e.status,
      })
      return jsonResponse({ error: e.message }, e.status, req)
    }
    logRequest({ requestId, action: 'admin-update-user', outcome: 'exception', status: 500 })
    return jsonResponse({ error: 'Internal error' }, 500, req)
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
